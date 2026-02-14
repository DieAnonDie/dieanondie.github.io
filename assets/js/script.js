'use strict';

let lastClickedBtn = null;
let objects = [];
let categories = [];


function parseCSV(csvText) {
	const rows = csvText.split('\n');
	const headers = rows[0].split(';');
	const arrayOfObjects = rows.slice(1).map(row => {
		const values = row.split(';');
		const obj = {};
		headers.forEach((header, index) => {
			let value = values[index];
			if (header === "date") {
				const [month, year] = value.split('/');
				value = new Date(year, month - 1);
			}
			else if (header === "portrait") {
				value = value.toLowerCase() === 'true';
			}
			else if (header === "downloadUrl") {
				value = (value.toLowerCase() === 'null')? null : value;
			}
			obj[header] = value;
		});
		return obj;
	});
	return arrayOfObjects;
}

async function fetchCSV(url) {
	try {
		const response = await fetch(url);
		return await response.text();
	} catch (error) {
		console.error('Error fetching CSV:', error);
		return null;
	}
}

function onlyUnique(value, index, array) {
	return array.indexOf(value) === index;
}

async function readCSV() {
	const csvText = await fetchCSV('./assets/data/portfolio.csv');
	if (csvText != null) {
		objects = parseCSV(csvText)
			.sort((a, b) => {
				if (a.date < b.date)
					return -1;
				if (a.date > b.date)
					return 1;
				return 0;
			})
			.reverse();
		categories = objects
			.map(item => item.category)
			.filter(onlyUnique)
			.sort();
		return true;
	}
	return false;
}

function toggleModal() {
	const modalContainer = document.querySelector("[data-modal-container]");
	const overlay = document.querySelector("[data-overlay]");

	modalContainer.classList.toggle("active");
	overlay.classList.toggle("active");
}

function createProjectList(objects, categoryFilter) {
	let projectList = document.getElementById("project-list");
	projectList.innerHTML = "";
	objects
		.filter((item) => (categoryFilter === "all") || (categoryFilter === item.category))
		.forEach((item) => {
			let li = document.createElement("li");
			li.setAttribute("class", "project-item active");
			li.setAttribute("data-category", "applications");
			li.setAttribute("data-filter-item", "");
			projectList.appendChild(li);

			let a = document.createElement("a");
			a.addEventListener("click", function () {
				const modalFigure = document.querySelector("[data-modal-figure]");
				const modalTitle = document.querySelector("[data-modal-title]");
				const modalCategory = document.querySelector("[data-modal-category]");
				const modalDate = document.querySelector("[data-modal-date]");
				const modalDescription = document.querySelector("[data-modal-description]");
				const modalDownloadButton = document.querySelector("[data-modal-download-btn]");

				modalFigure.innerHTML = "";
				let iframe = document.createElement("iframe");
				iframe.setAttribute("src", item.videoUrl);
				iframe.setAttribute("title", item.title);
				iframe.setAttribute("frameborder", 0);
				iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
				iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
				iframe.setAttribute("allowfullscreen", "");
				if (item.portrait) {
					iframe.setAttribute("width", 505);
					iframe.setAttribute("height", 800);
				}
				else {
					iframe.setAttribute("width", 994);
					iframe.setAttribute("height", 559);
				}
				modalFigure.appendChild(iframe);

				modalTitle.innerHTML = item.title;
				modalCategory.innerHTML = "Category: " + item.category;
				modalDescription.innerHTML = item.description;
				modalDate.innerHTML = "Created the " + item.date.toLocaleDateString();

				if (item.downloadUrl !== null) {
					modalDownloadButton.removeAttribute("disabled");
					modalDownloadButton.setAttribute("onclick", "location.href='" + item.downloadUrl + "'");
				}
				else {
					modalDownloadButton.removeAttribute("onclick");
					modalDownloadButton.setAttribute("disabled", "");
				}

				toggleModal();
			});
			li.appendChild(a);

			let figure = document.createElement("figure");
			figure.setAttribute("class", "project-img");
			a.appendChild(figure);

			let youtubeVideoId = item.videoUrl.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/).pop();
			let img = document.createElement("img");
			img.setAttribute("src", "https://img.youtube.com/vi/" + youtubeVideoId + "/maxresdefault.jpg");
			img.setAttribute("alt", item.title);
			figure.appendChild(img);

			let h3 = document.createElement("h3");
			h3.setAttribute("class", "project-title");
			h3.innerHTML = item.title;
			a.appendChild(h3);

			let p = document.createElement("p");
			p.setAttribute("class", "project-category");
			p.innerHTML = item.category;
			a.appendChild(p);
		});
}

function createCategories(categories) {
	let filterList = document.getElementById("filter-list");

	let categoriesAndAll = ["all"].concat(categories);
	categoriesAndAll.forEach((item) => {
		let li = document.createElement("li");
		li.setAttribute("class", "filter-item");
		filterList.appendChild(li);

		let button = document.createElement("button");
		button.setAttribute("data-filter-btn", "");
		button.innerHTML = item.toLowerCase();
		button.addEventListener("click", function () {
			let selectedValue = this.innerText;
			createProjectList(objects, selectedValue);

			lastClickedBtn.classList.remove("active");
			this.classList.add("active");
			lastClickedBtn = this;
		});
		li.appendChild(button);
	});

	lastClickedBtn = document.querySelectorAll("[data-filter-btn]")[0];
	lastClickedBtn.classList.add("active");
}

async function create() {
	const read = await readCSV();
	if (read) {
		createProjectList(objects, "all");
		createCategories(categories);
	}

	// add click event to modal close button
	const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
	modalCloseBtn.addEventListener("click", toggleModal);

	const overlay = document.querySelector("[data-overlay]");
	overlay.addEventListener("click", toggleModal);
}

create();
