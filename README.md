# Frontend Mentor - FX Checker solution

This is a solution to the [FX Checker challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/foreign-exchange-currency-converter). Frontend Mentor challenges help you improve your coding skills by building realistic projects.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
  - [AI Collaboration](#ai-collaboration)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

**Note: Delete this note and update the table of contents based on what sections you keep.**

## Overview

### The challenge

Your users should be able to:

#### Converter

- [x] Enter an amount to send and see it convert in real time as they type
- [x] Pick the "send" and "receive" currencies from a searchable currency picker
- [x] See the live exchange rate for the active pair (for example, `1 USD = 0.8530 EUR`)
- [x] Swap the send and receive currencies with the swap button
- [x] Favorite the active pair, and log a conversion to their history

#### Currency picker

- [x] Search the full list of available currencies by code
  - [ ] or name
- [x] See currencies grouped into "Popular" and "Other currencies", each row showing the flag, code, and name
- [x] See a check against the currency that's currently selected

#### Live markets ticker

- [x] See a ticker of currency pairs, each with its current rate and 24-hour change (up or down)

#### Rate history

- [x] View a line and area chart of the active pair's rate over time
- [x] Switch the chart range between 1D, 1W, 1M, 3M, 1Y, and 5Y
- [x] See the open, last, absolute change, and percentage change for the selected range

#### Compare

- [x] See their send amount converted into a range of other currencies at once, each with its reference rate
- [x] Pin or unpin any comparison row to their favorites
- [x] Load a pair into the converter by selecting its row

#### Favorites

- [x] See their pinned pairs, each with its live rate and 24-hour change
- [x] Load a pinned pair back into the converter by selecting its row
- [x] Unpin a pair they no longer want to track

#### Conversion log

- [x] See a log of conversions they've made,each showing the relative time, the pair, and the send and receive amounts
- [x] Clear the whole log
- [x] Delete an individual entry

#### UI & accessibility

- [x] View the optimal layout for the interface depending on their device's screen size
- [x] See hover and focus states for all interactive elements on the page
- [ ] Navigate the entire app using only their keyboard

### Screenshot

![](./screenshot.jpg)

Add a screenshot of your solution. The easiest way to do this is to use Firefox to view your project, right-click the page and select "Take a Screenshot". You can choose either a full-height screenshot or a cropped one based on how long the page is. If it's very long, it might be best to crop it.

Alternatively, you can use a tool like [FireShot](https://getfireshot.com/) to take the screenshot. FireShot has a free option, so you don't need to purchase it.

Then crop/optimize/edit your image however you like, add it to your project, and update the file path in the image above.

**Note: Delete this note and the paragraphs above when you add your screenshot. If you prefer not to add a screenshot, feel free to remove this entire section.**

### Links

- Solution URL: [Add solution URL here](https://your-solution-url.com)
- Live Site URL: [Add live site URL here](https://your-live-site-url.com)

## My process

- Initially I built this with the API code in the various Astro components. However, I noticed that I was reusing a lot of code and could probably use the same API call to fill in various parts of the UI. So I built out individual functions by referring back to an old Odin project for structure. This helped reduce the codebase quite a bit and reduce API calls. Further optimization is required, but this works well for now.

### Built with

- Semantic HTML5 markup
- CSS custom properties
- Flexbox
- CSS Grid
- Mobile-first workflow

### What I learned

Use this section to recap over some of your major learnings while working through this project. Writing these out and providing code samples of areas you want to highlight is a great way to reinforce your own knowledge.

To see how you can add code snippets, see below:

```html
<h1>Some HTML code I'm proud of</h1>
```

```css
.proud-of-this-css {
  color: papayawhip;
}
```

```js
const proudOfThisFunc = () => {
  console.log("🎉");
};
```

If you want more help with writing markdown, we'd recommend checking out [The Markdown Guide](https://www.markdownguide.org/) to learn more.

**Note: Delete this note and the content within this section and replace with your own learnings.**

### Continued development

Use this section to outline areas that you want to continue focusing on in future projects. These could be concepts you're still not completely comfortable with or techniques you found useful that you want to refine and perfect.

**Note: Delete this note and the content within this section and replace with your own plans for continued development.**

### Useful resources

- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- This helped me understand the fetch API for pulling the FX data
- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
- This helped me understand how to store favorited currencies and pairs in local storage
- [Nice Select](https://nerdy.dev/nice-select)
- This resource helped me with designing the select element for the currency selectors

### AI Collaboration

I occasionally used Gemini to help debug issues with the code to pull API data and use it in the content when I hit a snag.

## Author

- Frontend Mentor - [@jkaps9](https://www.frontendmentor.io/profile/jkaps9)

## Acknowledgments

This is where you can give a hat tip to anyone who helped you out on this project. Perhaps you worked in a team or got some inspiration from someone else's solution. This is the perfect place to give them some credit.

**Note: Delete this note and edit this section's content as necessary. If you completed this challenge by yourself, feel free to delete this section entirely.**
