import gsap from "gsap";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";
import "../styles/_bootloader.scss";

export class BootLoader extends BaseComponent {
  private timeline: gsap.core.Timeline | null = null;

  private readonly logoPath: string =
    "M11.106 2.553a1 1 0 0 1 1.788 0l2.851 5.701l5.702 2.852a1 1 0 0 1 .11 1.725l-.11 .063l-5.702 2.851l-2.85 5.702a1 1 0 0 1 -1.726 .11l-.063 -.11l-2.852 -5.702l-5.701 -2.85a1 1 0 0 1 -.11 -1.726l.11 -.063l5.701 -2.852z";

  constructor() {
    super();
  }

  public create(): void {
    if (document.querySelector(".boot-screen")) return;

    this.element = DomUtils.create("div", {
      className: "boot-screen",
      id: "boot-screen",
      parent: document.body,
      html: `
            <div class="logo-wrapper">
                <svg class="logo-svg" viewBox="0 0 24 24">
                <path d="${this.logoPath}" />
                </svg>
            </div>

            <div class="spinner-wrapper">
                <svg class="spinner-svg" viewBox="0 0 50 50">
                <circle 
                    class="spinner-path" 
                    cx="25" 
                    cy="25" 
                    r="20"
                />
                </svg>
            </div>
        `,
    });

    this.initAnimations();
  }

  private initAnimations(): void {
    if (!this.element) return;

    const spinner = this.element.querySelector(".spinner-svg");
    const path = this.element.querySelector(".spinner-path");
    const logo = this.element.querySelector(".logo-svg");

    if (!spinner || !path || !logo) return;

    gsap.set(logo, { scale: 0.8, opacity: 0, y: 40 });
    gsap.set(spinner, { opacity: 0 });

    if (this.timeline) this.timeline.kill();
    this.timeline = gsap.timeline();

    gsap.to(spinner, {
      rotation: 360,
      duration: 3,
      repeat: -1,
      ease: "none",
      transformOrigin: "center center",
    });

    const dashTL = gsap.timeline({ repeat: -1 });
    gsap.set(path, { strokeDasharray: "1, 150", strokeDashoffset: 0 });

    dashTL
      .to(path, {
        strokeDasharray: "90, 150",
        strokeDashoffset: -35,
        duration: 1.5,
        ease: "power1.inOut",
      })
      .to(path, {
        strokeDasharray: "90, 150",
        strokeDashoffset: -124,
        duration: 1.5,
        ease: "power1.inOut",
      });

    this.timeline
      .to(logo, {
        scale: 1,
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
      })
      .to(logo, {
        y: 0,
        duration: 1.0,
        ease: "power3.inOut",
        delay: 0.2,
      })
      .to(
        spinner,
        {
          opacity: 1,
          duration: 0.8,
        },
        "-=0.5"
      );
  }

  public remove(callback?: () => void): void {
    if (!this.element) {
      if (callback) callback();
      return;
    }

    if (this.timeline) this.timeline.kill();

    const spinner = this.element.querySelector(".spinner-svg");
    const logo = this.element.querySelector(".logo-svg");

    const exitTimeline = gsap.timeline({
      onComplete: () => {
        this.destroy();
        if (callback) callback();
      },
    });

    exitTimeline
      .to(spinner, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .to(
        logo,
        {
          y: 40,
          duration: 0.8,
          ease: "power3.inOut",
        },
        "-=0.2"
      )
      .to(
        logo,
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: "power2.inOut",
        },
        "-=0.8"
      );
  }

  public override destroy(): void {
    if (this.timeline) this.timeline.kill();
    gsap.killTweensOf(".spinner-svg");
    gsap.killTweensOf(".spinner-path");
    gsap.killTweensOf(".logo-svg");
    this.timeline = null;

    super.destroy();
  }
}
