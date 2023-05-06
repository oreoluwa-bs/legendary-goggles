import imagesLoaded from "imagesloaded";

const body = document.body;
export const preloader = (selector: string) => {
  return new Promise((resolve) => {
    const imgwrap = document.createElement("div");
    imgwrap.style.visibility = "hidden";
    body.appendChild(imgwrap);

    [...document.querySelectorAll<HTMLElement>(selector)].forEach((el) => {
      const imgEl = document.createElement("img");
      imgEl.style.width = "0";
      imgEl.src = el.dataset.img!;
      imgEl.className = "preload";
      imgwrap.appendChild(imgEl);
    });

    imagesLoaded(document.querySelectorAll(".preload"), () => {
      imgwrap.parentNode?.removeChild(imgwrap);
      body.classList.remove("loading");
      resolve(null);
    });
  });
};
