import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <header>
        <img src={post.data.banner.url} alt="" />
      </header>
      <main>
        <article>
          <h1>{post.data.title}</h1>

          <div className={styles.infos}>
            <span className={styles.date}>
              <FiCalendar /> {post.first_publication_date}
            </span>
            <span className={styles.author}>
              <FiUser /> {post.data.author}
            </span>
            <span className={styles.readTime}>
              <FiClock /> 4 min
            </span>
          </div>

          {post.data.content.map(content => (
            <>
              <h3
                className={styles.title}
                dangerouslySetInnerHTML={{ __html: content.heading.toString() }}
              ></h3>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: content.body.toString() }}
              />
            </>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  return {
    paths: posts.results.map(post => `/post/${post.uid}`),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  console.log(response);

  const post = {
    first_publication_date: format(new Date(), 'cc LLL yyyy', {
      locale: ptBR,
    }),
    data: {
      title: RichText.asText(response.data.title),
      banner: {
        url: response.data.banner.url,
      },
      author: RichText.asText(response.data.author),
      content: response.data.content.map(content => {
        return {
          heading: RichText.asText(content.heading),
          body: RichText.asHtml(content.body),
        };
      }),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30,
  };
};
