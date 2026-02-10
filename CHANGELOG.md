# Changelog

## [1.5.1](https://github.com/diplodoc-platform/liquid/compare/v1.5.0...v1.5.1) (2026-02-10)


### Bug Fixes

* remove unused catch variables in evaluate.ts ([aa04813](https://github.com/diplodoc-platform/liquid/commit/aa048136dd6801dcdfa89a0bbe6acd4aceefa127))
* Update infra to v1.13.2 ([1d8d5e1](https://github.com/diplodoc-platform/liquid/commit/1d8d5e1b6edb303269f54385c80fae546831e71d))

## [1.5.0](https://github.com/diplodoc-platform/liquid/compare/v1.4.0...v1.5.0) (2025-12-27)


### Features

* add unit tests to pre-commit hook and fix ESLint warnings ([c1b956f](https://github.com/diplodoc-platform/liquid/commit/c1b956f2d29e2573cf10856c5a4223c1dd5ad5ad))


### Bug Fixes

* add include-component-in-tag: false to release-please config ([1da2fcc](https://github.com/diplodoc-platform/liquid/commit/1da2fccc1d7051853e462e4ff941ebec102454fa))
* correct dependency installation for workspace mode ([f78dda0](https://github.com/diplodoc-platform/liquid/commit/f78dda09522981e97a8c3e62dda7f1c78b94f324))
* remove invalid --no-warn-ignored flag from ESLint command ([2681934](https://github.com/diplodoc-platform/liquid/commit/26819343094316224400e8d7fbe141935ca4cf82))
* remove package-name from release-please config ([791d990](https://github.com/diplodoc-platform/liquid/commit/791d9904c82a298932632245a55bc99c7077dc51))
* replace lodash/cloneDeepWith with native implementation ([b48d8e0](https://github.com/diplodoc-platform/liquid/commit/b48d8e0a3270d6761030f70108be5f11bea6bbdb))
* resolve ESLint issues in cloneDeepWith and vitest.config.mjs ([87aab8a](https://github.com/diplodoc-platform/liquid/commit/87aab8aa4eebdb4961402a19a918ee102b444fc8))
* resolve ESLint negated condition warning and vitest.config.mjs parsing ([2c16df5](https://github.com/diplodoc-platform/liquid/commit/2c16df560a8d5a302cecceb18173a6e4a711b865))
* resolve ESLint negated condition warning by inverting condition ([7fa3893](https://github.com/diplodoc-platform/liquid/commit/7fa3893a6e51adef34f323429f4c73b12ac34777))
* resolve ESLint warnings for negated conditions in cloneDeepWith ([d2f16a2](https://github.com/diplodoc-platform/liquid/commit/d2f16a25a481401e326101719ee904bb79623b2c))
* resolve prettier issue in lint-staged by passing filenames explicitly ([d22a2a3](https://github.com/diplodoc-platform/liquid/commit/d22a2a3cf2736b53f1672cea58889ac2285b970a))
* update CI workflow for workspace compatibility ([ecb7a43](https://github.com/diplodoc-platform/liquid/commit/ecb7a43493644ca91e71c6f001b1646d4604b0be))
* update lint-staged config to exclude config files from ESLint ([64f6c78](https://github.com/diplodoc-platform/liquid/commit/64f6c788defaff88cef8000dd8d33b50c09e38ae))

## [1.4.0](https://github.com/diplodoc-platform/liquid/compare/v1.3.4...v1.4.0) (2025-12-22)


### Features

* add legacyConditions ([#22](https://github.com/diplodoc-platform/liquid/issues/22)) ([5f8b9ec](https://github.com/diplodoc-platform/liquid/commit/5f8b9eca54c348fe74ee59004782beeec43b748d))

## [1.3.4](https://github.com/diplodoc-platform/liquid/compare/v1.3.3...v1.3.4) (2025-09-05)


### Bug Fixes

* add new line case test ([a609e15](https://github.com/diplodoc-platform/liquid/commit/a609e15405016ef4a1b626641964c7fe3565c7af))
* new line issue for windows os ([c8daa3c](https://github.com/diplodoc-platform/liquid/commit/c8daa3cbe5580d2e273f0cb7b9650be99709f9cc))
* run test on different os ([029ab93](https://github.com/diplodoc-platform/liquid/commit/029ab93e8a760c97315320486923f02070d00085))

## [1.3.3](https://github.com/diplodoc-platform/liquid/compare/v1.3.2...v1.3.3) (2025-09-03)


### Bug Fixes

* add keepConditionSyntaxOnTrue option ([83da29e](https://github.com/diplodoc-platform/liquid/commit/83da29ed5022d360ec2d2e4e39b319c05a5af005))

## [1.3.2](https://github.com/diplodoc-platform/liquid/compare/v1.3.1...v1.3.2) (2025-06-18)


### Bug Fixes

* add NoValue export ([37f42d2](https://github.com/diplodoc-platform/liquid/commit/37f42d28b601d8d22aa4444923b89505054f747d))
* bump setup-node action ([4445d07](https://github.com/diplodoc-platform/liquid/commit/4445d07f28676a1dbfb257902bad3f9c2a9266ba))

## [1.3.1](https://github.com/diplodoc-platform/liquid/compare/v1.3.0...v1.3.1) (2025-05-14)


### Bug Fixes

* extractFrontMatter returns undefined if it receive metadata with only a comment ([2ffdc0e](https://github.com/diplodoc-platform/liquid/commit/2ffdc0eeac554f33473e40759982f47cc8789b7b))

## [1.3.0](https://github.com/diplodoc-platform/liquid/compare/v1.2.0...v1.3.0) (2025-03-19)


### Features

* Lazy compute sourcemap ([13e02f8](https://github.com/diplodoc-platform/liquid/commit/13e02f869bbcf62ba85ad561ddf5d0c5ef896803))

## [1.2.0](https://github.com/diplodoc-platform/liquid/compare/v1.1.3...v1.2.0) (2025-03-05)


### Features

* Add options to extractFrontmatter util ([2a50fb9](https://github.com/diplodoc-platform/liquid/commit/2a50fb9fc92802ff9470004e18f087bce15b2443))

## [1.1.3](https://github.com/diplodoc-platform/liquid/compare/v1.1.2...v1.1.3) (2025-02-28)


### Bug Fixes

* Add shortcuts to sourcemap API ([084e073](https://github.com/diplodoc-platform/liquid/commit/084e07396a649d0cbb02ca1e514c75128d5cb243))

## [1.1.2](https://github.com/diplodoc-platform/liquid/compare/v1.1.1...v1.1.2) (2025-02-28)


### Bug Fixes

* Fix exposed API ([da45c6e](https://github.com/diplodoc-platform/liquid/commit/da45c6e39a47a5dbef8aa1079780b9b2b4d3d2f6))

## [1.1.1](https://github.com/diplodoc-platform/liquid/compare/v1.1.0...v1.1.1) (2025-02-28)


### Bug Fixes

* Update release flow ([0c618b0](https://github.com/diplodoc-platform/liquid/commit/0c618b0dbdfd5b43e661d20d7621ad0a1ab3e151))

## [1.1.0](https://github.com/diplodoc-platform/liquid/compare/v1.0.0...v1.1.0) (2025-02-28)


### Features

* Change Liquid API ([6738b05](https://github.com/diplodoc-platform/liquid/commit/6738b05a528655ee5c173a6628623e187ce38ad9))
* Change sourcemaps API ([b3e3721](https://github.com/diplodoc-platform/liquid/commit/b3e3721c092b7ac5e0034f6b15013b7cab683b3d))
* Expose public API ([aed2871](https://github.com/diplodoc-platform/liquid/commit/aed28710d9cb3fd92e0e2f931d26747662fb67ef))


### Dependency update

* Downgrade some deps ([94b9bcf](https://github.com/diplodoc-platform/liquid/commit/94b9bcf7b3aed38d3f7cef63bef3d881ed3ccdb0))
* Update all deps to latest versions ([66bb020](https://github.com/diplodoc-platform/liquid/commit/66bb020cc92c53f5ac869d22d9900a4354294f50))

## 1.0.0 (2025-02-28)

Initial commit.

Liquid was extracted from @diplodoc/transform package
