const portalConfig = {
	sharePointUrl: "https://1drv.ms/f/c/3282d669f30858d3/IgDUBJ4VzOMLRafmyD4hAoNGAXFSXx2faeFy2AFceMdV1x8?e=LON9uh",
	attendanceFormUrl: "https://forms.cloud.microsoft/r/vt5bZf8h5N",
};

const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector(".main-nav");
const toast = document.querySelector(".toast");
let toastTimer;

function getNextMeetingDate(now = new Date()) {
	const nextMeeting = new Date(now);
	const daysUntilThursday = (4 - now.getDay() + 7) % 7;
	const hasThursdayMeetingEnded = daysUntilThursday === 0
		&& (now.getHours() > 21 || (now.getHours() === 21 && now.getMinutes() >= 30));

	nextMeeting.setDate(now.getDate() + daysUntilThursday + (hasThursdayMeetingEnded ? 7 : 0));
	nextMeeting.setHours(0, 0, 0, 0);
	return nextMeeting;
}

function updateNextMeeting() {
	const dateElement = document.querySelector("[data-next-meeting-date]");
	const nextMeeting = getNextMeetingDate();
	const shortDate = new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "short",
	}).format(nextMeeting).replace(" de ", " ").replace(".", "").toUpperCase();

	dateElement.textContent = shortDate;
}

function showToast(message) {
	window.clearTimeout(toastTimer);
	toast.textContent = message;
	toast.classList.add("visible");
	toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3600);
}

function closeMenu() {
	mainNav.classList.remove("open");
	document.body.classList.remove("menu-open");
	menuButton.setAttribute("aria-expanded", "false");
	menuButton.setAttribute("aria-label", "Abrir menu");
	menuButton.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
	window.lucide?.createIcons();
}

menuButton.addEventListener("click", () => {
	const isOpen = mainNav.classList.toggle("open");
	document.body.classList.toggle("menu-open", isOpen);
	menuButton.setAttribute("aria-expanded", String(isOpen));
	menuButton.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
	menuButton.innerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}" aria-hidden="true"></i>`;
	window.lucide?.createIcons();
});

mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.querySelectorAll(".resource-tabs button").forEach((button) => {
	button.addEventListener("click", () => {
		const filter = button.dataset.filter;

		document.querySelectorAll(".resource-tabs button").forEach((tab) => {
			const isSelected = tab === button;
			tab.classList.toggle("active", isSelected);
			tab.setAttribute("aria-selected", String(isSelected));
		});

		document.querySelectorAll(".resource-item").forEach((item) => {
			item.hidden = filter !== "all" && item.dataset.category !== filter;
		});
	});
});

function configureExternalLink(selector, url, unavailableMessage) {
	const link = document.querySelector(selector);

	if (url) {
		link.href = url;
		link.target = "_blank";
		link.rel = "noopener";
		return;
	}

	link.addEventListener("click", (event) => {
		event.preventDefault();
		showToast(unavailableMessage);
	});
}

configureExternalLink(
	"[data-sharepoint-link]",
	portalConfig.sharePointUrl,
	"O acervo da turma será publicado aqui em breve."
);

configureExternalLink(
	"[data-attendance-link]",
	portalConfig.attendanceFormUrl,
	"O formulário de presença abre no início de cada encontro."
);

updateNextMeeting();
window.setInterval(updateNextMeeting, 30_000);
document.querySelector("#current-year").textContent = new Date().getFullYear();
window.lucide?.createIcons();
