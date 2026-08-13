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

// O calendário exibe o mês corrente em uma grade fixa de 6 semanas iniciadas no domingo.
const calendarWeeks = 6;
const thursday = 4;

function updateCalendar(now = new Date()) {
	const daysGrid = document.querySelector("[data-calendar-days]");
	const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);
	const year = now.getFullYear();

	document.querySelector("[data-calendar-month]").textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
	document.querySelector("[data-calendar-year]").textContent = String(year);
	daysGrid.setAttribute("aria-label", `Calendário de ${monthName} de ${year}`);

	const firstOfMonth = new Date(year, now.getMonth(), 1);
	const gridStart = new Date(year, now.getMonth(), 1 - firstOfMonth.getDay());

	daysGrid.replaceChildren(...Array.from({ length: calendarWeeks * 7 }, (_, index) => {
		const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
		const isCurrentMonth = date.getMonth() === now.getMonth() && date.getFullYear() === year;
		const cell = document.createElement("span");

		cell.textContent = String(date.getDate());
		cell.classList.toggle("muted", !isCurrentMonth);
		cell.classList.toggle(
			"meeting-day",
			isCurrentMonth && date.getDay() === thursday && date.getDate() <= now.getDate()
		);
		return cell;
	}));
}

function updateCalendarInvite() {
	const nextMeeting = getNextMeetingDate();
	const start = new Date(nextMeeting);
	const end = new Date(nextMeeting);
	start.setHours(20, 0, 0, 0);
	end.setHours(22, 0, 0, 0);

	// O Outlook interpreta a data sem fuso como horário local de quem abre o convite.
	const asLocalDateTime = (date) => {
		const pad = (value) => String(value).padStart(2, "0");
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
	};

	const inviteUrl = new URL("https://outlook.office.com/calendar/0/deeplink/compose");
	inviteUrl.searchParams.set("subject", "Curso Básico de Espiritismo IEE 2026");
	inviteUrl.searchParams.set("startdt", asLocalDateTime(start));
	inviteUrl.searchParams.set("enddt", asLocalDateTime(end));
	inviteUrl.searchParams.set("body", "Encontro da turma do Curso Básico de Espiritismo IEE 2026.");

	document.querySelector("[data-calendar-invite]").href = inviteUrl.toString();
}

function updateNotices() {
	const board = document.querySelector("[data-notice-board]");
	const noticeDateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
	const notices = Array.from(board.children)
		.sort((a, b) => b.dataset.noticeDate.localeCompare(a.dataset.noticeDate));

	notices.forEach((notice, index) => {
		const isCurrent = index === 0;
		const [year, month, day] = notice.dataset.noticeDate.split("-").map(Number);
		const time = notice.querySelector("[data-notice-time]");

		notice.classList.toggle("is-current", isCurrent);
		notice.querySelector("[data-notice-tag]").textContent = isCurrent ? "Aviso da semana" : "Arquivo";
		time.dateTime = notice.dataset.noticeDate;
		time.textContent = noticeDateFormat.format(new Date(year, month - 1, day));
	});

	board.replaceChildren(...notices);
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
updateCalendar();
updateCalendarInvite();
updateNotices();
window.setInterval(() => {
	updateNextMeeting();
	updateCalendar();
	updateCalendarInvite();
}, 30_000);
document.querySelector("#current-year").textContent = new Date().getFullYear();
window.lucide?.createIcons();
