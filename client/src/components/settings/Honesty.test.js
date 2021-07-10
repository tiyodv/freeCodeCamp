import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import TestRenderer from 'react-test-renderer';

import Honesty from './honesty';
import { Button } from '@freecodecamp/react-bootstrap';

describe('<Honesty />', () => {
  const renderer = new ShallowRenderer();
  const updateIsHonestMock = jest.fn();

  test('<Honesty /> snapshot when isHonest is false', () => {
    const componentToRender = (
      <Honesty isHonest={false} updateIsHonest={updateIsHonestMock} />
    );
    const view = renderer.render(componentToRender);
    expect(view).toMatchSnapshot('Honesty');
  });

  test('<Honesty /> snapshot when isHonest is true', () => {
    const componentToRender = (
      <Honesty isHonest={true} updateIsHonest={updateIsHonestMock} />
    );
    const view = renderer.render(componentToRender);
    expect(view).toMatchSnapshot('HonestyAccepted');
  });

  test('should call updateIsHonest method on clicking agree button', async () => {
    const root = TestRenderer.create(
      <Honesty isHonest={false} updateIsHonest={updateIsHonestMock} />
    ).root;

    const button = await root.findByType(Button);
    button.props.onClick();
    expect(updateIsHonestMock).toHaveBeenCalledWith({ isHonest: true });
  });
});
