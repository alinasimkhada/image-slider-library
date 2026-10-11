
class ImageSlider {
    constructor(viewportId, trackId, previousId, nextId, dotsId, counterId) {
        this.viewport = document.getElementById(viewportId);
        this.track = document.getElementById(trackId);
        this.previousButton = document.getElementById(previousId);
        this.nextButton = document.getElementById(nextId);
        this.dotsContainer = document.getElementById(dotsId);
        this.counter = document.getElementById(counterId);

        this.originalSlides = Array.from(this.track.children);
        this.totalSlides = this.originalSlides.length;

        this.currentIndex = 1;
        this.activeIndex = 0;
        this.isAnimating = false;
        this.queuedIndex = null;
        this.animationFallback = null;

        if (this.totalSlides === 0) return;

        this.createClones();
        this.createDots();
        this.bindEvents();
        this.updatePosition(false);
        this.updateIndicators();
    }

    createClones() {
        const lastClone = this.originalSlides[this.totalSlides - 1].cloneNode(true);
        const firstClone = this.originalSlides[0].cloneNode(true);

        lastClone.setAttribute("aria-hidden", "true");
        firstClone.setAttribute("aria-hidden", "true");

        this.track.insertBefore(lastClone, this.originalSlides[0]);
        this.track.appendChild(firstClone);
    }

    createDots() {
        this.dots = this.originalSlides.map((slide, index) => {
            const dot = document.createElement("button");

            dot.type = "button";
            dot.setAttribute("aria-label", `Go to image ${index + 1}`);
            dot.setAttribute("aria-current", "false");

            dot.addEventListener("click", () => {
                this.goToSlide(index);
            });

            this.dotsContainer.appendChild(dot);

            return dot;
        });
    }

    bindEvents() {
        this.nextButton.addEventListener("click", () => {
            this.navigate(1);
        });

        this.previousButton.addEventListener("click", () => {
            this.navigate(-1);
        });

        this.track.addEventListener("transitionend", (event) => {
            if (
                event.target === this.track &&
                event.propertyName === "transform"
            ) {
                this.finishTransition();
            }
        });

        window.addEventListener("resize", () => {
            this.updatePosition(false);
        });

        document.addEventListener("keydown", (event) => {
            const target = event.target;

            if (
                target.isContentEditable ||
                ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
            ) {
                return;
            }

            if (event.key === "ArrowRight") {
                this.navigate(1);
            } else if (event.key === "ArrowLeft") {
                this.navigate(-1);
            }
        });
    }

    updatePosition(animate = true) {
        this.track.style.transition = animate
            ? ""
            : "none";

        const offset = this.currentIndex * this.viewport.clientWidth;

        this.track.style.transform = `translateX(-${offset}px)`;

        if (!animate) {
            this.track.getBoundingClientRect();
        }
    }

    updateIndicators() {
        this.dots.forEach((dot, index) => {
            const isActive = index === this.activeIndex;

            dot.classList.toggle("active", isActive);
            dot.setAttribute("aria-current", String(isActive));
        });

        this.counter.textContent =
            `${String(this.activeIndex + 1).padStart(2, "0")} / ` +
            `${String(this.totalSlides).padStart(2, "0")}`;
    }

    navigate(direction) {
        const baseIndex = this.queuedIndex ?? this.activeIndex;
        const nextIndex =
            (baseIndex + direction + this.totalSlides) % this.totalSlides;

        if (this.isAnimating) {
            this.queuedIndex = nextIndex;
            return;
        }

        const nextPhysicalIndex = this.currentIndex + direction;
        this.moveTo(nextPhysicalIndex, nextIndex);
    }

    goToSlide(index) {
        if (this.isAnimating) {
            this.queuedIndex = index;
            return;
        }

        if (index === this.activeIndex) return;

        this.moveTo(index + 1, index);
    }

    moveTo(physicalIndex, logicalIndex) {
        this.isAnimating = true;
        this.currentIndex = physicalIndex;
        this.activeIndex = logicalIndex;

        this.updateIndicators();
        this.updatePosition(true);

        clearTimeout(this.animationFallback);

        this.animationFallback = setTimeout(() => {
            this.finishTransition();
        }, 700);
    }

    finishTransition() {
        if (!this.isAnimating) return;

        clearTimeout(this.animationFallback);

        if (this.currentIndex === this.totalSlides + 1) {
            this.currentIndex = 1;
            this.updatePosition(false);
        } else if (this.currentIndex === 0) {
            this.currentIndex = this.totalSlides;
            this.updatePosition(false);
        }

        this.isAnimating = false;

        if (this.queuedIndex !== null) {
            const nextIndex = this.queuedIndex;
            this.queuedIndex = null;
            this.goToSlide(nextIndex);
        }
    }
}

new ImageSlider(
    "sliderViewport",
    "slideTrack",
    "previousButton",
    "nextButton",
    "sliderDots",
    "slideCounter"
);
