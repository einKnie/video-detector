# VideoDetector

This Firefox Addon detects when videos are playing in a tab and prepends the tab's title with a custom string.  
The string can be set on the Addon's preferences page.


## Installation

#### The Easy Way
 
[Get it on the Firefox Addons Page](https://addons.mozilla.org/de/firefox/addon/videodetector/)

#### Old Install Instructions
To install as a temporary Firefox extension:

1. Clone this repo to your machine
2. In Firefox, navigate to about:debugging
3. Under _**This Firefox**_, click _**Load Temporary Add-On**_.
4. In the dialog, navigate to the cloned repo and open any file in the _video_ directory - e.g. _manifest.json_.

The extension is now installed and active.

## Usage

The Addon currently supports **youtube.com**, **vimeo.com**, **orf.at**, **vivo.sx**, **twitch.tv**, and **netflix.com**.  
While the Addon is active, it will monitor any Firefox tabs on a supported site to check if a video is playing.  
Whenever a video is detected as playing, the title of the respective tab is changed to contain a custom string.
The Addon also comes with a toolbar button to quickly suspend and resume the operation, or access the settings page.  
On the settings page, you can change the custom string as well as disable operation for specific domains.

##### Example
By setting the custom string to `"Playing ~ "`

    JavaScript Crash Course For Beginners - YouTube
becomes

    Playing ~ JavaScript Crash Course For Beginners - YouTube

The custom string may contain any symbols that the Firefox titlebar can render.  
That means, standard emojis like 😊 or 🖤 are possible. Additionally, you can specify the positioning of the original video title with _(%title%)_. If no _(%title%)_ attribute is set, the string is added before the original title per default.

##### Example
By setting the custom string to `"(%title%) 🖤"`

	JavaScript Crash Course For Beginners - YouTube
becomes

	JavaScript Crash Course For Beginners - YouTube 🖤

## Bugs

Probably a few.  
But since this Addon does very little overall, the worst that can happen is it may stop doing its thing until a reload under certain conditions.  

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



