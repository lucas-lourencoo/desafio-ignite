import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination);

  function getPosts() {
    fetch(posts.next_page)
      .then(async response => await response.json())
      .then((data: PostPagination) => {
        setPosts({
          next_page: data.next_page,
          results: [
            ...posts.results,
            ...data.results.map((post: Post) => {
              return {
                uid: post.uid,
                first_publication_date: format(new Date(), 'cc LLL yyyy', {
                  locale: ptBR,
                }),
                data: {
                  title: RichText.asText(post.data.title),
                  subtitle: RichText.asText(post.data.subtitle),
                  author: RichText.asText(post.data.author),
                },
              };
            }),
          ],
        });
      });
  }

  return (
    <>
      <Head>
        <title>Spacetravelling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a href="">
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>{post.first_publication_date}</time>
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}

          {posts.next_page && (
            <button
              onClick={() => getPosts()}
              type="button"
              className={styles.morePostsButton}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 2 }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(new Date(), 'cc LLL yyyy', {
        locale: ptBR,
      }),
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
