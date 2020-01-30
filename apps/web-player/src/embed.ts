/* eslint-disable no-console, no-empty */
import { init as playerInit } from '@podlove/player-actions/lifecycle'
import { init as buttonInit } from '@podlove/button-actions/lifecycle'
import * as configParser from '@podlove/player-config'

import { version } from '../package.json'

import * as context from './lib/context'
import canvas, { Canvas } from './lib/canvas'
import connect from './lib/connect'
import { parseConfig } from './lib/config'
import * as player from './player'
import * as subscribeButton from './subscribe-button'

const podlovePlayer = async (selector: string, episode: string, meta: string) => {
  let target: Canvas;

  try {
    const config: configParser.CompleteConfig = await parseConfig(episode, meta)    
    context.create(config)
    target = await canvas(selector)

    target.init()
    const playerStore = await player.create(config, target)

    playerStore.dispatch(playerInit(config))

    if (configParser.subscribeButton(config)) {
      const buttonStore = await subscribeButton.create(config)

      buttonStore.dispatch(buttonInit(subscribeButton.config(config)))

      // inter store connection
      connect(
        { store: playerStore, prefix: 'PLAYER' },
        { store: buttonStore, prefix: 'BUTTON' }
      )
    }

    try {
      player.restore(config, playerStore)
    } catch (e) { }

    return playerStore
  } catch (err) {
    console.group(`Error in Podlove Webplayer ${version}`)
    console.warn('selector', selector)
    console.warn('config', episode)
    console.warn(err)
    console.groupEnd()
  }
}

if (typeof (window as any).podlovePlayer === 'undefined') {
  (window as any).podlovePlayer = podlovePlayer
}
