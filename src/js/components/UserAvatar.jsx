import React from 'react';

/**
 * If username is not provided, infer one from e-mail address. If no e-mail
 * address is provided, return placeholder text.
 *
 * @param {string} nickname - Username (if available)
 * @param {string} email - User e-mail address (if available)
 * @return {string}
 */
function getUserDisplayName(nickname, email) {
  if (nickname) return nickname;
  if (email) return email.split('@')[0];
  return 'Anonymous';
}

/**
 * Returns an <img> component if an image url is provided, or an empty <div>
 * if there is no image url.
 *
 * @param {string} imageUrl - absolute URL to image
 * @return {React.Component}
 */
function getAvatarImage(imageUrl) {
  if (imageUrl) {
    // Alt text is blank because the display name will also be displayed by the image.
    return (<img
      src={imageUrl}
      className="avatar"
      alt=""
    />);
  }

  return <div className="avatar avatar-blank" />;
}

export default function UserAvatar(props) {
  const user = props.user;
  const displayName = getUserDisplayName(user.nickname, user.email);
  const AvatarImage = getAvatarImage(user.avatar);
  const AdminStar = (user.admin === true) ?
    <span className="avatar-admin-star">★</span> :
    null;

  return (
    <span>
      {AvatarImage}
      {displayName}
      {AdminStar}
    </span>
  );
}

UserAvatar.propTypes = {
  user: React.PropTypes.shape({
    nickname: React.PropTypes.string,
    email: React.PropTypes.string,
    avatar: React.PropTypes.string,
    admin: React.PropTypes.bool,
  }).isRequired,
};

UserAvatar.defaultProps = {
  user: {
    nickname: '',
    email: '',
    avatar: '',
    admin: false,
  },
};
