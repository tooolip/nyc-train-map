import type { Register, ThemeSetArgs } from 'claude-code'

import { nycTrainsSvg } from './scene'

const SCENE_NAME = 'nyc-trains-live'
const SCENE = nycTrainsSvg()

// A dark scene: the map, under a thin indigo veil so the chat stays readable.
const LOOK: ThemeSetArgs = {
  backdrop: { scene: SCENE_NAME, glass: { blur: 2, tint: '#101232', opacity: 0.45 } },
  overrideColorScheme: 'dark',
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.theme.set(LOOK)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.scene !== SCENE_NAME || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="An ASCII map of New York City with trains moving along their lines" isInteractive />
  })
}
