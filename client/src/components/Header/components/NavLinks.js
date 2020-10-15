import React from 'react';
import { Link, SkeletonSprite, AvatarRenderer } from '../../helpers';
import PropTypes from 'prop-types';
import Login from '../components/Login';

const propTypes = {
  displayMenu: PropTypes.bool,
  fetchState: PropTypes.shape({ pending: PropTypes.bool }),
  user: PropTypes.object
};

export function AuthOrProfile({ user, pending }) {
  const isUserDonating = user && user.isDonating;
  const isUserSignedIn = user && user.username;
  const isTopContributor =
    user && user.yearsTopContributor && user.yearsTopContributor.length > 0;

  if (pending) {
    return (
      <div className='nav-skeleton'>
        <SkeletonSprite />
      </div>
    );
  } else if (!isUserSignedIn) {
    return (
      <>
        <li>
          <Link className='nav-link' to='/learn'>
            Curriculum
          </Link>
        </li>
        <Login data-test-label='landing-small-cta'>Sign In</Login>
      </>
    );
  } else {
    return (
      <>
        <li>
          <Link className='nav-link' to='/learn'>
            Curriculum
          </Link>
        </li>
        <li>
          <Link className='nav-link' to={`/${user.username}`}>
            Profile
            <AvatarRenderer
              isDonating={isUserDonating}
              isTopContributor={isTopContributor}
              picture={user.picture}
              userName={user.username}
            />
          </Link>
        </li>
      </>
    );
  }
}

export function NavLinks({ displayMenu, user, fetchState }) {
  const { pending } = fetchState;
  return (
    <div className='main-nav-group'>
      <ul className={'nav-list' + (displayMenu ? ' display-flex' : '')}>
        <AuthOrProfile pending={pending} user={user} />
      </ul>
    </div>
  );
}

NavLinks.propTypes = propTypes;
NavLinks.displayName = 'NavLinks';
export default NavLinks;
