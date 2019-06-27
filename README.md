[![Build Status](https://travis-ci.org/wix-incubator/istanbul-ignore-legacy.svg?branch=master)](https://travis-ci.org/wix-incubator/istanbul-ignore-legacy)
# istanbul-auto-ignore

## Motivation
* When writing a tests driven projects, we find it best to set `jest` `coverageThreshold` option to 100, because each untested code will fail the build and be noticed.
* Sometimes a code can't be tested for various reasons, but setting `coverageThreshold` to less than 100 will make newly untested code harder to find.
* Therefore we find it best to use `coverageThreshold` set to 100, and add `//istanbul ignore` (coverage ignore) comments instead of setting `coverageThreshold` to anything less.
* `istanbul-auto-ignore` helps an existing project with `coverageThreshold < 100` to get to 100 by adding `//istanbul ignore` comments next to uncovered code.
