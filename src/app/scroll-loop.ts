interface ScrollLoopOptions {
  scrollArea: HTMLElement;
  clones: HTMLElement[] | NodeListOf<HTMLElement>;
}
export class ScrollLoop {
  context: HTMLElement;
  clones: HTMLElement[] | NodeListOf<HTMLElement>;
  cloneHeight: number;
  disableScroll = false;

  constructor({ scrollArea, clones = [] }: ScrollLoopOptions) {
    this.context = scrollArea;
    this.clones = clones;

    this.cloneHeight = this._getCloneHeight();
    this.context.scrollTo({ top: 1 });

    this.disableScroll = false;

    this._addEventListeners();
  }

  private _addEventListeners() {
    window.addEventListener("resize", () => {
      this.cloneHeight = this._getCloneHeight();

      if (this._getScrollPos() <= 0) {
        this.context.scrollTo({ top: 1 }); // Scroll 1 pixel to allow upwards scrolling
      }
    });

    this.context.addEventListener("scroll", () => {
      window.requestAnimationFrame(this._onScroll.bind(this));
    });
  }

  _getScrollPos() {
    return this.context.scrollTop - (this.context.clientTop || 0);
  }

  _getCloneHeight() {
    return Array.from(this.clones, (item) => item.offsetHeight).reduce(
      (prev, curr) => prev + curr,
      0
    );
  }

  _onScroll() {
    if (!this.disableScroll) {
      const scrollPosition = this._getScrollPos();

      /**
       *  Check if the total scrolled position is greater than or equal to the available scroll height
       */
      if (this.cloneHeight + scrollPosition >= this.context.scrollHeight) {
        this.context.scrollTo({ top: 1 });
        this.disableScroll = true;
      } else if (scrollPosition <= 0) {
        this.context.scrollTo({
          top: this.context.scrollHeight - this.cloneHeight,
        });
        this.disableScroll = true;
      }
    } else {
      // Disable scroll-jumping for a short time to avoid flickering
      window.setTimeout(() => {
        this.disableScroll = false;
      }, 40);
    }
  }
}

//   let cloneHeight = getCloneHeight();

//   function getScrollPos() {
//     return context.scrollTop - (context.clientTop || 0);
//   }
//   function getCloneHeight() {
//     return Array.from(clones, (item) => item.offsetHeight).reduce(
//       (prev, curr) => prev + curr,
//       0
//     );
//   }
//   window.addEventListener("resize", function () {
//     cloneHeight = getCloneHeight();

//     if (getScrollPos() <= 0) {
//       context.scrollTo({ top: 1 }); // Scroll 1 pixel to allow upwards scrolling
//     }
//   });

//   let disableScroll = false;

//   context.addEventListener("scroll", function () {
//     window.requestAnimationFrame(updateScroll);
//   });

//   function updateScroll() {
//     if (!disableScroll) {
//       const scrollPosition = getScrollPos();

//       if (cloneHeight + scrollPosition >= context.scrollHeight) {
//         context.scrollTo({ top: 1 });
//         disableScroll = true;
//       } else if (scrollPosition <= 0) {
//         context.scrollTo({ top: context.scrollHeight - cloneHeight });
//         disableScroll = true;
//       }
//     } else {
//       // Disable scroll-jumping for a short time to avoid flickering
//       window.setTimeout(function () {
//         disableScroll = false;
//       }, 40);
//     }
//   }

//   window.onload = () => {
//     context.scrollTo({ top: 1 });
//   };
