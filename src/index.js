import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  Clock,
  Vector2,
  PlaneGeometry,
  MeshBasicMaterial,
  RepeatWrapping,
  BufferAttribute,
  sRGBEncoding,
  HalfFloatType
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { BlendFunction, LUT3DEffect, SMAAEffect, BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing'

import { MatcapSwitchMaterial } from './materials/MatcapSwitchMaterial'
import { gltfLoader, lutCubeLoader, textureLoader } from './loaders'

class App {
  #resizeCallback = () => this.#onResize()

  constructor(container, opts = { physics: false, debug: false }) {
    this.container = document.querySelector(container)
    this.screen = new Vector2(this.container.clientWidth, this.container.clientHeight)

    this.hasPhysics = opts.physics
    this.hasDebug = opts.debug
  }

  async init() {
    this.#createScene()
    this.#createCamera()
    this.#createRenderer()

    if (this.hasPhysics) {
      const { Simulation } = await import('./physics/Simulation')
      this.simulation = new Simulation(this)

      const { PhysicsBox } = await import('./physics/Box')
      const { PhysicsFloor } = await import('./physics/Floor')

      Object.assign(this, { PhysicsBox, PhysicsFloor })
    }

    this.#createFloor()
    this.#createClock()
    this.#addListeners()
    this.#createControls()

    await this.#loadTextures()
    await this.#loadModel()

    this.#createPostprocess()

    if (this.hasDebug) {
      const { Debug } = await import('./Debug.js')
      new Debug(this)

      const { default: Stats } = await import('stats.js')
      this.stats = new Stats()
      document.body.appendChild(this.stats.dom)
    }

    this.renderer.setAnimationLoop(() => {
      this.stats?.begin()

      this.#update()
      this.#render()

      this.stats?.end()
    })

    console.log(this)
  }

  destroy() {
    this.renderer.dispose()
    this.#removeListeners()
  }

  #update() {
    const elapsed = this.clock.getElapsedTime()

    this.mesh.material.uniforms.u_Time.value = elapsed

    this.simulation?.update()
  }

  #render() {
    this.composer.render()
  }

  #createScene() {
    this.scene = new Scene()
  }

  #createCamera() {
    this.camera = new PerspectiveCamera(75, this.screen.x / this.screen.y, 0.1, 100)
    this.camera.position.set(-0.6, 0.3, 1.2)
  }

  #createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: false,
      powerPreference: "high-performance",
      antialias: false
    })


    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.screen.x, this.screen.y)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.setClearColor(0x030303)
    this.renderer.outputEncoding = sRGBEncoding
  }

  #createPostprocess() {
    this.composer = new EffectComposer(this.renderer, { frameBufferType: HalfFloatType })

    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const bloomPass = new EffectPass(this.camera, new BloomEffect({ intensity: 0.65, luminanceThreshold: 0.57, luminanceSmoothing: 0.35 }))
    this.composer.addPass(bloomPass)

    const smaaPass = new EffectPass(this.camera, new SMAAEffect())
    this.composer.addPass(smaaPass)

    const blendFunction = BlendFunction.COLOR
    const lutEffect = this.renderer.capabilities.isWebGL2 ?
                                      new LUT3DEffect(this.textures.lut, { blendFunction }) :
                                      new LUT3DEffect(this.textures.lut.convertToUint8().toDataTexture(), { blendFunction })
    const lutPass = new EffectPass(this.camera, lutEffect)
    this.composer.addPass(lutPass)
  }

  #createFloor() {
    if (!this.hasPhysics) return

    const geometry = new PlaneGeometry(20, 20, 1, 1)
    const material = new MeshBasicMaterial({ color: 0x424242 })

    this.floor = new Mesh(geometry, material)
    this.floor.rotateX(-Math.PI*0.5)
    this.floor.position.set(0, -2, 0)

    this.scene.add(this.floor)

    const body = new this.PhysicsFloor(this.floor, this.scene)
    this.simulation.addItem(body)
  }

  async #loadTextures() {
    const [noise, matcapA, matcapB] = await textureLoader.load(['/noise.png', '/matcap_A.png', '/matcap_B.png'])

    noise.wrapS = noise.wrapT = RepeatWrapping

    const [lut] = await lutCubeLoader.load(['/Lenox-340.CUBE'])

    this.textures = {
      noise,
      matcapA,
      matcapB,
      lut
    }
  }

  /**
   * Load a 3D model and append it to the scene
   */
  async #loadModel() {
    const gltf = await gltfLoader.load('/suzanne.glb')

    this.mesh = gltf.scene.children[0]

    this.mesh.geometry = this.mesh.geometry.toNonIndexed()

    {
      const centroid = new Float32Array(this.mesh.geometry.getAttribute('position').count*3)
      const position = this.mesh.geometry.getAttribute('position').array

      for (let i = 0; i < centroid.length; i+=9) {
        const x = (position[i+0] + position[i+3] + position[i+6]) / 3
        const y = (position[i+1] + position[i+4] + position[i+7]) / 3
        const z = (position[i+2] + position[i+5] + position[i+8]) / 3

        centroid.set([x, y, z], i)
        centroid.set([x, y, z], i+3)
        centroid.set([x, y, z], i+6)
      }

      this.mesh.geometry.setAttribute('a_Centroid', new BufferAttribute(centroid, 3, false))
    }

    this.mesh.material = MatcapSwitchMaterial
    this.mesh.material.uniforms.t_Noise.value = this.textures.noise
    this.mesh.material.uniforms.t_MatcapA.value = this.textures.matcapA
    this.mesh.material.uniforms.t_MatcapB.value = this.textures.matcapB

    this.scene.add(this.mesh)
  }

  #createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  #createClock() {
    this.clock = new Clock()
  }

  #addListeners() {
    window.addEventListener('resize', this.#resizeCallback, { passive: true })
  }

  #removeListeners() {
    window.removeEventListener('resize', this.#resizeCallback, { passive: true })
  }

  #onResize() {
    this.screen.set(this.container.clientWidth, this.container.clientHeight)

    this.camera.aspect = this.screen.x / this.screen.y
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.screen.x, this.screen.y)
    this.composer.setSize(this.screen.x, this.screen.y)
  }
}

window._APP_ = new App('#app', {
  physics: window.location.hash.includes('physics'),
  debug: window.location.hash.includes('debug')
})

window._APP_.init()
