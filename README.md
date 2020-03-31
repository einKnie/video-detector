# VideoDetector

This Firefox addon detects when videos are playing and prepends the tab's title with a custom string.  
The string can be custom set on the addon's preferences page.


## Installation

**_This addon is not published._**

To install as a temporary Firefox extension:

1. Clone this repo to your machine
2. In Firefox, navigate to about:debugging
3. Under _**This Firefox**_, click _**Load Temporary Add-On**_.
4. In the dialog, navigate to the cloned repo and open any file in the _video_ directory - e.g. _manifest.json_.

The extension is now installed and active.

## Usage

The addon currently supports **youtube.com**, **vimeo.com**, **orf.at**, **vivo.sx**, and **netflix.com**.  
While the addon is active, it will monitor any Firefox tabs on a supported site to detect if a video is playing.  
As soon as a video starts playing,
the title of the repective tab is changed to contain a custom string which is configurable via the addon's setting page.
The addon also comes with a toolbar button to quickly suspend and resume the operation.

#### For example:

    JavaScript Crash Course For Beginners - YouTube - Mozilla Firefox
becomes

    Playing ~ JavaScript Crash Course For Beginners - YouTube - Mozilla Firefox

## Bugs

Probably many.  
But since this addon does very little overall, the worst that can happen is it may stop until a reload under certain conditions.  



Before you lie the very first lines of code I have ever written in JavaScript.
As such, this project is mostly a learning experience for me.  
Bug reports as well as feature requests are very welcome.

## Background

I currently use a desktop setup of i3wm with Compton, though I only really use Compton to slightly dim any inactive screens.
While this is generally great for my work flow, one specific situation kept irking me:

_I'm watching a youtube video on one monitor while I'm doing something else on the other.  
The video is dimmed._

First World Problem, right?  
But still, I found myself wondering if there was a way I could make Compton detect an active 
video stream in Firefox windows and not dim the screen in that case. After some testing, I realized that it would be easiest to
let Firefox detect active video streams itself and adjust its window title to contain a string which I can then use in Compton to exclude 
the specific window from the inactive-dim setting.

Anyways, this is my personal use case for this addon. 



