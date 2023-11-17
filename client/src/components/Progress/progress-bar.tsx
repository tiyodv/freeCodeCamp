import React from 'react';

export function ProgressBar({ now }: { now: number }) {
  return (
    <>
      <div className='progress-bar-background'></div>
      <div
        className='progress-bar-percent'
        data-playwright-test-label='progress-bar-percentage'
        data-testid='fcc-progress-bar-percent'
        style={{ width: `${now}%` }}
      ></div>
    </>
  );
}
