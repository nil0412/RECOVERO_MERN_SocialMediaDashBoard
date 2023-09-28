import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { addFriend, fetchUserProfile, removeFriend } from "../api";
import styles from "../styles/settings.module.css";
import Loader from "../components/Loader";
import { useAuth } from "../hooks";

const UserProfile = () => {
	const [user, setUser] = useState({});
	const [itsMe, setItsMe] = useState(false);
	const [isFriend, setIsFriend] = useState(false);
	const [loading, setLoading] = useState(true);
	const [requestInProgress, setRequestInProgress] = useState(false);
	const { userId } = useParams();
	const navigate = useNavigate();
	const auth = useAuth();

	useEffect(() => {
		const getUser = async () => {
			const response = await fetchUserProfile(userId);
			if (response.success) {
				setUser(response.data.user);
				setItsMe(auth.user._id === response.data.user._id);
				setIsFriend(() => {
					const friends = auth.user.friendship;
					let friendIds = [];
					if (friends.length !== 0) {
						console.log("friends: ", friends);
						friendIds = friends.map((friend) => friend.to_user);
						const index = friendIds.indexOf(userId);
						if (index !== -1) {
							return true;
						}
					}
					return false;
				});
			} else {
				toast.error(response.message);
				return navigate("/");
			}
			setLoading(false);
		};
		getUser();
	}, [userId, navigate, toast]); //addToast

	if (loading) {
		return <Loader />;
	}

	// const checkIfUserIsAFriend = () => {
	// 	const friends = auth.user.friendship;
	// 	let friendIds = [];
	// 	if (friends.length !== 0) {
	//     console.log("friends: ", friends);
	// 		friendIds = friends.map((friend) => friend.to_user);
	// 		const index = friendIds.indexOf(userId);
	// 		if (index !== -1) {
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// };

	const handleRemoveFriendClick = async () => {
		setRequestInProgress(true);
		const response = await removeFriend(userId);
		if (response.success) {
			const friendship = auth.user.friends.filter(
				(friend) => friend.to_user._id === userId
			);
			auth.updateUserFriends(false, friendship[0]);
			toast.success("Friend Removed Successfully");
		} else {
			toast.error(response.message);
		}
		setRequestInProgress(false);
	};

	const handleAddFriendClick = async () => {
		setRequestInProgress(true);
		const response = await addFriend(userId);
		if (response.success) {
			const { newFriendship } = response.data;
			auth.updateUserFriends(true, newFriendship);

			toast.success("Friend Added Successfully");
		} else {
			toast.error(response.message);
		}
		setRequestInProgress(false);
	};

	return (
		<div className={styles.settings}>
			<div className={styles.imgContainer}>
				<img
					src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
					alt=""
				/>
			</div>

			<div className={styles.field}>
				<div className={styles.fieldLabel}>Email</div>
				<div className={styles.fieldValue}>{user.email}</div>
			</div>

			<div className={styles.field}>
				<div className={styles.fieldLabel}>Name</div>
				<div className={styles.fieldValue}>{user.name}</div>
			</div>

			<div className={styles.btnGrp}>
				{itsMe ? (
					navigate("/settings")
				) : isFriend ? (
					<button
						className={`button ${styles.saveBtn}`}
						onClick={handleRemoveFriendClick}
						disabled={requestInProgress}>
						{requestInProgress ? "Removing friend..." : "Remove friend"}
					</button>
				) : (
					<button
						className={`button ${styles.saveBtn}`}
						onClick={handleAddFriendClick}
						disabled={requestInProgress}>
						{requestInProgress ? "Adding friend..." : "Add friend"}
					</button>
				)}
			</div>
		</div>
	);
};

export default UserProfile;
