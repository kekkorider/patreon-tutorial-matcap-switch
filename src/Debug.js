import { Pane } from 'tweakpane'
import { Color, Vector4 } from 'three'

export class Debug {
  constructor(app) {
    this.app = app

    this.#createPanel()
    this.#createSceneConfig()
    this.#createPhysicsConfig()
    this.#createEffectConfig()
    this.#createPostprocessConfig()
  }

  refresh() {
    this.pane.refresh()
  }

  #createPanel() {
    this.pane = new Pane({
      container: document.querySelector('#debug')
    })
  }

  #createSceneConfig() {
    const folder = this.pane.addFolder({ title: 'Scene' })

    const params = {
      background: { r: 18, g: 18, b: 18 }
    }

    folder.addInput(params, 'background', { label: 'Background Color' }).on('change', e => {
      this.app.renderer.setClearColor(new Color(e.value.r / 255, e.value.g / 255, e.value.b / 255))
    })
  }

  #createEffectConfig() {
    const folder = this.pane.addFolder({ title: 'Effect' })
    const mesh = this.app.scene.getObjectByName('Suzanne')
    const { material } = mesh

    folder.addInput(material.uniforms.u_EffectProgress, 'value', { label: 'Progress', min: -2, max: 2 })
    folder.addInput(material.uniforms.u_StripSize, 'value', { label: 'Size', min: 0, max: 0.5 })
    folder.addInput(material.uniforms.u_NoiseStrength, 'value', { label: 'Noise strength', min: 0, max: 3 })

    this.#createColorUniformControl(mesh, folder, 'u_EmissionColorA', 'Emission Color A')
    this.#createColorUniformControl(mesh, folder, 'u_EmissionColorB', 'Emission Color B')
  }

  #createPostprocessConfig() {
    const folder = this.pane.addFolder({ title: 'Postprocess - Bloom' })
    const bloomPass = this.app.composer.passes[1]
    const [bloomEffect] = bloomPass.effects
    const { uniforms: luminanceUniforms } = bloomEffect.luminanceMaterial

    folder.addInput(bloomEffect, 'intensity', { label: 'Intensity', min: 0, max: 3 })
    folder.addInput(luminanceUniforms.threshold, 'value', { label: 'Threshold', min: 0, max: 1 })
    folder.addInput(luminanceUniforms.smoothing, 'value', { label: 'Smoothing', min: 0, max: 1 })
  }

  #createPhysicsConfig() {
    if (!this.app.hasPhysics) return

    const folder = this.pane.addFolder({ title: 'Physics' })

    folder.addButton({ title: 'Toggle Debug' }).on('click', () => {
      window.dispatchEvent(new CustomEvent('togglePhysicsDebug'))
    })
  }

  /**
   * Adds a color control for the given object to the given folder.
   *
   * @param {*} obj Any THREE object with a color property
   * @param {*} folder The folder to add the control to
   */
  #createColorControl(obj, folder) {
    const baseColor255 = obj.color.clone().multiplyScalar(255)
    const params = { color: { r: baseColor255.r, g: baseColor255.g, b: baseColor255.b } }

    folder.addInput(params, 'color', { label: 'Color' }).on('change', e => {
      obj.color.setRGB(e.value.r, e.value.g, e.value.b).multiplyScalar(1 / 255)
    })
  }

  /**
   * Adds a color control for a custom uniform to the given object in the given folder.
   *
   * @param {THREE.Mesh} obj A `THREE.Mesh` object
   * @param {*} folder The folder to add the control to
   * @param {String} uniformName The name of the uniform to control
   * @param {String} label The label to use for the control
   */
  #createColorUniformControl(obj, folder, uniformName, label = 'Color') {
    const preMultVector = new Vector4(255, 255, 255, 1)
    const postMultVector = new Vector4(1 / 255, 1 / 255, 1 / 255, 1)

    const baseColor255 = obj.material.uniforms[uniformName].value.clone().multiply(preMultVector)
    const params = { color: { r: baseColor255.x, g: baseColor255.y, b: baseColor255.z, a: baseColor255.w } }

    folder.addInput(params, 'color', { label, view: 'color', color: { alpha: true } }).on('change', e => {
      obj.material.uniforms[uniformName].value.set(e.value.r, e.value.g, e.value.b, e.value.a).multiply(postMultVector)
    })
  }
}
