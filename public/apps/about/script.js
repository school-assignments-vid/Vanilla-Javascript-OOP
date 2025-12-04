if (!container) return;

const githubBtn = container.querySelector('#github-btn');
const twitterBtn = container.querySelector('#twitter-btn');

if (githubBtn) {
    githubBtn.addEventListener('click', () => {
        window.open('https://github.com/sobbing-cat', '_blank');
    });
}

if (twitterBtn) {
    twitterBtn.addEventListener('click', () => {
        window.open('https://x.com/notsobbingcat', '_blank');
    });
}