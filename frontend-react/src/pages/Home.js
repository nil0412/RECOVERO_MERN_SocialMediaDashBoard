import { FriendsList, Loader, Comment, CreatePost, Post } from "../components";
import styles from "../styles/home.module.css";
import { useAuth, usePosts } from "../hooks";
import { useEffect } from "react";
import { getPosts } from "../api";

const Home = () => {
	const auth = useAuth();
	const posts = usePosts();

	useEffect(() => {
		getPosts();
	}, []);

  if (posts.loading) {
		return <Loader />;
	}

	return (
		<div className={styles.home}>
			<div className={styles.postsList}>
				<CreatePost />
				{posts.data &&
					posts.data.map((post) => (
						<Post post={post} key={`post-${post._id}`}></Post>
					))}
			</div>
			{auth.user && <FriendsList />}
		</div>
	);
};

export default Home;
