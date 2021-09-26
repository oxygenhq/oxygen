Oxygen
=======

Oxygen is an open source framework and tool-set built on top of Appium, WebdriverIO, and Selenium that significantly simplifies writing and running automation tests. It implements many commonly recurring patterns out-of-the-box and hides complexities of the aforementioned backends behind a concise API. 


## Supported Platforms

* Android - Native, Hybrid, and Web
* iOS  - Native, Hybrid, and Web
* Windows - Chrome, Internet Explorer
* Linux - Chrome
* OS X - Chrome

## Installation
```shell
npm install -g oxygen-cli
```

## OS Specific requirements for building:

#### Windows:
* ```npm --add-python-to-path='true' --debug install --global windows-build-tools``` from ```cmd``` with admin rights.
* [Optional.  Required for DB support] Windows SDK
* [Optional.  Required for Video recording support] https://github.com/BtbN/FFmpeg-Builds/releases win64-lgpl-shared-4.4\bin add to PATH env

#### Linux
* [Optional.  Required for DB support] unixodbc binaries and development libraries:  
Debian/Ubuntu - `sudo apt-get install unixodbc unixodbc-dev`  
RedHat/CentOS - `sudo dnf install unixODBC unixODBC-devel`

#### OS X
* [Optional.  Required for DB support] unixodbc binaries and development libraries: `brew install unixodbc`


## Getting Started

See the documentation at [docs.oxygenhq.org](http://docs.oxygenhq.org)
