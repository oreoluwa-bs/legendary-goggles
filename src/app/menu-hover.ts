import { gsap } from "gsap";
import { clamp, getMousePos, lerp, map } from "./utils";

let mousepos = { x: 0, y: 0 };
let mousePosCache = mousepos;
let direction = {
  x: mousePosCache.x - mousepos.x,
  y: mousePosCache.y - mousepos.y,
};

window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

interface AnimatableProperties {
  tx: { previous: number; current: number; amt: number };
  ty: { previous: number; current: number; amt: number };
  rotation: { previous: number; current: number; amt: number };
  brightness: { previous: number; current: number; amt: number };
}

export class MenuHover {
  DOM: { el: HTMLElement; menuItems: NodeListOf<HTMLElement> | HTMLElement[] };
  menuItems: MenuItem[];
  animatableProperties: AnimatableProperties;
  constructor(
    el: HTMLElement,
    menuItems: NodeListOf<HTMLElement> | HTMLElement[]
  ) {
    this.DOM = { el, menuItems };
    this.menuItems = [];

    this.animatableProperties = {
      tx: { previous: 0, current: 0, amt: 0.08 },
      ty: { previous: 0, current: 0, amt: 0.08 },
      rotation: { previous: 0, current: 0, amt: 0.08 },
      brightness: { previous: 1, current: 1, amt: 0.08 },
    };

    [...menuItems].forEach((item, pos) => {
      this.menuItems.push(new MenuItem(item, pos, this.animatableProperties));
    });

    this.showMenuItems();
  }

  showMenuItems() {
    gsap.to(
      this.menuItems.map((item) => item.DOM.textInner),
      {
        duration: 1.2,
        ease: "Expo.easeOut",
        startAt: { y: "100%" },
        y: 0,
        delay: (pos) => pos * 0.06,
      }
    );
  }
}

const defaultRect: DOMRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  toJSON() {},
};

class MenuItem {
  DOM: {
    reveal: HTMLElement;
    revealImage: HTMLElement;
    revealInner: HTMLElement;
    el: HTMLElement;
    textInner: HTMLElement;
  };
  position: number;
  animatableProperties: AnimatableProperties;
  mouseenterFn!: (ev: any) => void;
  mouseleaveFn!: () => void;
  tl?: gsap.core.Timeline;
  bounds: { reveal: DOMRect; el: DOMRect } = {
    reveal: { ...defaultRect },
    el: { ...defaultRect },
  };
  firstRAFCycle: boolean = true;
  requestId?: number;

  constructor(
    el: HTMLElement,
    pos: number,
    animatableProperties: AnimatableProperties
  ) {
    this.DOM = {
      el,
      textInner: el.querySelector(".menu__item-textinner")!,
      reveal: el.querySelector<HTMLElement>(".hover-reveal")!,
      revealImage: el.querySelector<HTMLElement>(".hover-reveal__img")!,
      revealInner: el.querySelector<HTMLElement>(".hover-reveal__inner")!,
    };
    this.position = pos;
    this.animatableProperties = animatableProperties;

    this.initEvents();
  }

  initEvents() {
    this.mouseenterFn = (ev) => {
      this.showImage();
      this.firstRAFCycle = true;

      this.loopRender();
    };
    this.mouseleaveFn = () => {
      this.stopRendering();
      this.hideImage();
    };

    this.DOM.el.addEventListener("mouseenter", this.mouseenterFn);
    this.DOM.el.addEventListener("mouseleave", this.mouseleaveFn);
  }

  calcBounds() {
    this.bounds = {
      reveal: this.DOM.reveal.getBoundingClientRect(),
      el: this.DOM.el.getBoundingClientRect(),
    };
  }

  showImage() {
    gsap.killTweensOf(this.DOM.revealInner);
    gsap.killTweensOf(this.DOM.revealImage);

    this.tl = gsap
      .timeline({
        onStart: () => {
          this.DOM.reveal.style.opacity = "1";
          gsap.set(this.DOM.el, { zIndex: 12 });
        },
      })
      .to(this.DOM.revealInner, {
        duration: 0.2,
        ease: "Sine.easeOut",
        startAt: { x: direction.x < 0 ? "-100%" : "100%" },
        x: "0%",
      })
      .to(
        this.DOM.revealImage,
        {
          duration: 0.2,
          ease: "Sine.easeOut",
          startAt: { x: direction.x < 0 ? "100%" : "-100%" },
          x: "0%",
        },
        0
      );
  }

  hideImage() {
    gsap.killTweensOf(this.DOM.revealInner);
    gsap.killTweensOf(this.DOM.revealImage);

    this.tl = gsap
      .timeline({
        onStart: () => {
          gsap.set(this.DOM.el, { zIndex: 1 });
        },
        onComplete: () => {
          gsap.set(this.DOM.reveal, { opacity: 0 });
        },
      })
      .to(this.DOM.revealInner, {
        duration: 0.2,
        ease: "Sine.easeOut",
        x: direction.x < 0 ? "100%" : "-100%",
      })
      .to(
        this.DOM.revealImage,
        {
          duration: 0.2,
          ease: "Sine.easeOut",
          x: direction.x < 0 ? "-100%" : "100%",
        },
        0
      );
  }

  render() {
    this.requestId = undefined;

    if (Boolean(this.firstRAFCycle)) {
      this.calcBounds();
    }

    // calculate the mouse distance (current vs previous cycle)
    const mouseDistanceX = clamp(
      Math.abs(mousePosCache.x - mousepos.x),
      0,
      100
    );
    direction = {
      x: mousePosCache.x - mousepos.x,
      y: mousePosCache.y - mousepos.y,
    };
    mousePosCache = { x: mousepos.x, y: mousepos.y };

    this.animatableProperties.tx.current =
      Math.abs(mousepos.x - this.bounds.el.left) - this.bounds.reveal.width / 2;

    this.animatableProperties.ty.current =
      Math.abs(mousepos.y - this.bounds.el.top) - this.bounds.reveal.height / 2;

    this.animatableProperties.tx.previous = this.firstRAFCycle
      ? this.animatableProperties.tx.current
      : lerp(
          this.animatableProperties.tx.previous,
          this.animatableProperties.tx.current,
          this.animatableProperties.tx.amt
        );
    this.animatableProperties.ty.previous = this.firstRAFCycle
      ? this.animatableProperties.ty.current
      : lerp(
          this.animatableProperties.ty.previous,
          this.animatableProperties.ty.current,
          this.animatableProperties.ty.amt
        );

    // new rotation value
    this.animatableProperties.rotation.current = this.firstRAFCycle
      ? 0
      : map(mouseDistanceX, 0, 100, 0, direction.x < 0 ? 60 : -60);
    // new filter value
    this.animatableProperties.brightness.current = this.firstRAFCycle
      ? 1
      : map(mouseDistanceX, 0, 100, 1, 4);

    this.animatableProperties.rotation.previous = this.firstRAFCycle
      ? this.animatableProperties.rotation.current
      : lerp(
          this.animatableProperties.rotation.previous,
          this.animatableProperties.rotation.current,
          this.animatableProperties.rotation.amt
        );
    this.animatableProperties.brightness.previous = this.firstRAFCycle
      ? this.animatableProperties.brightness.current
      : lerp(
          this.animatableProperties.brightness.previous,
          this.animatableProperties.brightness.current,
          this.animatableProperties.brightness.amt
        );

    // set styles
    gsap.set(this.DOM.reveal, {
      x: this.animatableProperties.tx.previous,
      y: this.animatableProperties.ty.previous,
      rotation: this.animatableProperties.rotation.previous,
      filter: `brightness(${this.animatableProperties.brightness.previous})`,
    });

    //
    this.firstRAFCycle = false;

    this.loopRender();
  }

  // start the render loop animation (rAF)
  loopRender() {
    if (!this.requestId) {
      this.requestId = requestAnimationFrame(() => this.render());
    }
  }
  // stop the render loop animation (rAF)
  stopRendering() {
    if (this.requestId) {
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  }
}
