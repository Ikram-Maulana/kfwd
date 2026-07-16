# [0.2.0](https://github.com/Ikram-Maulana/kfwd/compare/v0.1.2...v0.2.0) (2026-07-16)


### Bug Fixes

* catch spawn errors in --all loop to prevent partial startup ([8f79ad6](https://github.com/Ikram-Maulana/kfwd/commit/8f79ad64865acf0c28cf9b02fb5a415de5093692))
* close log file descriptor after spawning child process ([f0402e0](https://github.com/Ikram-Maulana/kfwd/commit/f0402e0dc899b0c640cf6898ab8959c11774e845))
* extract spawnOne helper and fix interactive start error handling and count ([d324f44](https://github.com/Ikram-Maulana/kfwd/commit/d324f44a2f9b27497a2db66860f28eec0492598f))
* read supervisor argv from correct indexes for node -e ([d0f4ed0](https://github.com/Ikram-Maulana/kfwd/commit/d0f4ed08f6b9fa797e0081d6f6529a2f3d56b76c))
* report successful spawn count in --all summary ([ce53786](https://github.com/Ikram-Maulana/kfwd/commit/ce537860a0786c65eee3e5fb5df5a23d4e3fbf8f))
* restart kubectl supervisor on spawn errors ([f73a4e8](https://github.com/Ikram-Maulana/kfwd/commit/f73a4e8022f9097a7ebc3a6101bbd19aee0a978b))
* use t.teardown for temp directory cleanup in start tests ([1cee155](https://github.com/Ikram-Maulana/kfwd/commit/1cee1554599af4125585d73976382887d23e1b13))
* wait for kubectl to exit before supervisor shuts down ([f7706f7](https://github.com/Ikram-Maulana/kfwd/commit/f7706f7e84b9ee1699a39a73fe3a13faf7f7991d))


### Features

* add --all flag to start and stop commands ([77f14fe](https://github.com/Ikram-Maulana/kfwd/commit/77f14fe622c93ada753646a5dbadfb7c6f805968))
* auto-restart kubectl port-forward on unexpected exit ([995d464](https://github.com/Ikram-Maulana/kfwd/commit/995d46490eaf06f6b7075155f72b42f86cabba73))



## [0.1.2](https://github.com/Ikram-Maulana/kfwd/compare/v0.1.1...v0.1.2) (2026-06-23)


### Bug Fixes

* sync package.json version in release workflow ([b6b8a9c](https://github.com/Ikram-Maulana/kfwd/commit/b6b8a9ca32321ebaced47e89a3eda261729a37b1))



## [0.1.1](https://github.com/Ikram-Maulana/kfwd/compare/v0.1.0...v0.1.1) (2026-06-23)


### Bug Fixes

* resolve @/ path aliases in dist and fix global CLI entry detection ([39a0b0f](https://github.com/Ikram-Maulana/kfwd/commit/39a0b0fbe09ca780fded83713d9d3b55d92f4e4b))



# [0.1.0](https://github.com/Ikram-Maulana/kfwd/compare/1a13b5079686e2bba48636d8c247a1eb4400a755...v0.1.0) (2026-06-23)


### Bug Fixes

* hoist tsx loader from ava config into NODE_OPTIONS for test script ([fa4ace5](https://github.com/Ikram-Maulana/kfwd/commit/fa4ace5ef25da7ec1b5917cd3adcccc56202b0d3))
* reorder tag-after-commit in release workflow, bump to 0.1.0 ([2286d84](https://github.com/Ikram-Maulana/kfwd/commit/2286d84550b1bbeb2952271438a0ff4c695e56de))
* restore ava child-process workers for tsx loader compatibility ([d43795c](https://github.com/Ikram-Maulana/kfwd/commit/d43795c4f50e40fb2e4b9d016523097d86219eea))
* scope ava test discovery to source test directory only ([f7df86b](https://github.com/Ikram-Maulana/kfwd/commit/f7df86b2c757e193667dc65ab73c16eb1cbef17b))


### Features

* add vercel-react-best-practices skill ([1a13b50](https://github.com/Ikram-Maulana/kfwd/commit/1a13b5079686e2bba48636d8c247a1eb4400a755))
* consolidate types, per-forward namespace, and service default ([09fc2cd](https://github.com/Ikram-Maulana/kfwd/commit/09fc2cd84eb0e2de033a5ad35bbce470cb8e80f1))
* implement core kfwd commands with config, kubectl, and TUI ([a331cac](https://github.com/Ikram-Maulana/kfwd/commit/a331cacea171b805a01b171c8adb03cbb272acd6))
* upgrade TUI forms, shared renderPick, styled status, and TUI-first remove ([8ccf3e9](https://github.com/Ikram-Maulana/kfwd/commit/8ccf3e95bac94b1b38c7e076b4b13212564cf34c))



