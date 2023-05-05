import { gsap } from "gsap";
import { map, calcWinsize, getMousePos, lerp } from "./utils";

// Calculate the viewport size
let winsize = calcWinsize();
window.addEventListener("resize", () => (winsize = calcWinsize()));

// Track the mouse position
let mousepos = { x: winsize.width / 2, y: winsize.height / 2 };
window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

interface MotionGridOptions {
  gridItems?: NodeListOf<HTMLElement> | HTMLElement[];
  element: HTMLElement;
}

export class MotionGrid {
  DOM: { el: HTMLElement };
  items: NodeListOf<HTMLElement> | HTMLElement[];
  gridItems: GridItem[];

  constructor(params: MotionGridOptions) {
    this.DOM = { el: params.element };
    this.items = params.gridItems ?? [];
    this.gridItems = [];
    params.gridItems?.forEach((item) => {
      this.gridItems.push(new GridItem(item));
    });

    this.showItems();
  }

  showItems() {
    const tl = gsap.timeline();

    tl.set(this.items, { scale: 0.7, opacity: 0 }, 0)
      .to(
        this.items,
        {
          duration: 2,
          ease: "Expo.easeOut",
          scale: 1,
          stagger: { amount: 0.6, grid: "auto", from: "center" },
        },
        0
      )
      .to(
        this.items,
        {
          duration: 3,
          ease: "Power1.easeOut",
          opacity: 0.4,
          //   stagger: { amount: 0.6, grid: "auto", from: "center" },
        },
        0
      );
  }
}

class GridItem {
  DOM: { el: HTMLElement };
  constructor(el: HTMLElement) {
    this.DOM = { el: el };
    this.move();
  }
  move() {
    // amount to move in each axis
    let translationVals = { tx: 0, ty: 0, r: 0 };

    // get random start and end movement boundaries
    const xstart = getRandomNumber(15, 60);
    const ystart = getRandomNumber(15, 60);
    const randR = getRandomNumber(-15, 15);

    // infinite loop
    const render = () => {
      /**
       * 🚨🚨🚨🚨 Explanation
       *
       * lerp essentially gets a value from a percentage (third argument) between the first two arguments
       *
       * map picks a new value by converting from one range to its equivalent in another
       *
       * i.e Get the 7th pecercent value between the tranlastion value (0 for example) and the new mapped value
       * in the range of -xstart and xstart i.e -60 and 60;
       */

      // Calculate the amount to move.
      // Using linear i‼️nterpolation to smooth things out.
      // Translation values will be in the range of [-start, start] for a cursor movement from 0 to the window's width/height
      translationVals.tx = lerp(
        translationVals.tx,
        map(mousepos.x, 0, winsize.width, -xstart, xstart),
        0.07
      );
      translationVals.ty = lerp(
        translationVals.ty,
        map(mousepos.y, 0, winsize.height, -ystart, ystart),
        0.07
      );
      translationVals.r = lerp(
        translationVals.r,
        map(mousepos.x, 0, winsize.width, -randR, randR),
        0.07
      );

      gsap.set(this.DOM.el, {
        x: translationVals.tx,
        y: translationVals.ty,
        rotation: translationVals.r,
      });
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}

function getRandomNumber(min = 0, max = 1) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
