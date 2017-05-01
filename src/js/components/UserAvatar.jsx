import React from 'react';
import PropTypes from 'prop-types';

/**
 * If username is not provided, infer one from e-mail address. If no e-mail
 * address is provided, return placeholder text.
 *
 * @param {string} nickname - Username (if available)
 * @param {string} email - User e-mail address (if available)
 * @return {string}
 */
function getDisplayName(nickname, email) {
  if (nickname) return nickname;
  if (email) return email.split('@')[0];
  return 'Anonymous';
}

/**
 * Returns an <img> component if an image url is provided, or an empty <div>
 * if there is no image url.
 *
 * @param {string} url - absolute URL to image
 * @return {React.Component}
 */
function getImageElement(url) {
  if (url) {
    // Alt text is blank because the display name will also be displayed by the image.
    return (<img
      src={url}
      className="avatar"
      alt=""
    />);
  }

  return <div className="avatar avatar-blank" />;
}

export default function UserAvatar(props) {
  const user = props.user;
  const displayName = getDisplayName(user.nickname, user.email);
  const imageElement = getImageElement(user.avatar);
  const adminStarElement = (user.admin === true) ?
    <span className="avatar-admin-star">★</span> :
    null;

  return (
    <span>
      {imageElement}
      {displayName}
      {adminStarElement}
    </span>
  );
}

UserAvatar.propTypes = {
  user: PropTypes.shape({
    nickname: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    admin: PropTypes.bool,
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
