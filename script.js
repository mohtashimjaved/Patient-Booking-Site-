import { supabaseclient, signoutfunc, session, deletedata } from "./database.js";
const menuToggle = document?.getElementById('menu-toggle');
const offCanvasMenu = document?.getElementById('off-canvas-menu');
const closeMenu = document?.getElementById('close-main-menu');
const overlay = document?.getElementById('overlay');

const userNameElement = document.getElementById('user-name');
const userEmailElement = document.getElementById('user-email');
const appointmentLi = document.getElementById('appointment-li');

const loginLink = document?.getElementById('login-link');
const signoutLink = document?.getElementById('signout-link');

let isLoggedIn = false;

function toggleNav() {
    offCanvasMenu.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = offCanvasMenu.classList.contains('open') ? 'hidden' : '';
}

function closeNav() {
    offCanvasMenu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

menuToggle?.addEventListener('click', toggleNav);
closeMenu?.addEventListener('click', closeNav);
overlay?.addEventListener('click', closeNav);

offCanvasMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId.length > 1) {
            e.preventDefault();
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
})


const checkSession = async () => {
    const getSession = await session();
    if (getSession.session) {
        const name = getSession.session.user.user_metadata.name
        const email = getSession.session.user.user_metadata.email
        userNameElement.innerText = name;
        userNameElement.style.textTransform = "capitalize"
        userEmailElement.innerText = email;

        appointmentLi.style.display = 'block';

        signoutLink.style.display = 'flex';
        loginLink.style.display = 'none';
    }
    else if (!getSession.session) {
        appointmentLi.style.display = 'none';

        signoutLink.style.display = 'none';
        loginLink.style.display = 'flex';
    }
}
checkSession()

signoutLink.addEventListener('click', signoutfunc)

const specialty = document.getElementById("specialty")
const doctor = document.getElementById("doctor")
const date = document.getElementById("date")
const time = document.getElementById("time")
const patientName = document.getElementById("patient-name")
const email = document.getElementById("email")
const phone = document.getElementById("phone")
const confirmBtn = document.getElementById("confirm-appointment")

if (window.location.pathname == "/appointment") {
    const checkSessionForAppointment = async () => {
        const getSession = await session()
        if (window.location.pathname == "/appointment.html" && !getSession.session) {
            window.location.href = "/login.html"
        } else {
            email.value = getSession.session.user.user_metadata.email
        }
    }
    checkSessionForAppointment()

    const getSpecialty = async () => {
        const { data, error } = await supabaseclient
            .from("doctors")
            .select("specialty")
        if (error) {
            console.error(error);
            return error
        }
        console.log(data);
        data.map((data) => {
            specialty.innerHTML += `<option value="${data.specialty}" >${data.specialty}</option>`
        })
        return data;
    }
    getSpecialty()
    const getDoctor = async () => {
        const { data, error } = await supabaseclient
            .from("doctors")
            .select("doctor_name")
            .eq("specialty", specialty.value)
        if (error) {
            console.error(error);
            return error
        }
        console.log(data);
        data.map((data) => {
            doctor.innerHTML += `<option value="${data.doctor_name}" >${data.doctor_name}</option>`
        })
        return data
    }
    specialty.addEventListener("change", () => {
        console.log(specialty.value);
        if (specialty.value != "placeholder") {
            doctor.disabled = false
            getDoctor()
        }
    })
    const getDay = async () => {
        const { data, error } = await supabaseclient
            .from("doctors")
            .select("days")
            .eq("doctor_name", doctor.value)
        if (error) {
            console.error(error);
            return error
        }
        console.log(JSON.parse(data[0].days));
        return JSON.parse(data[0].days)
    }
    doctor.addEventListener("change", () => {
        console.log(doctor.value);
        if (doctor.value != "placeholder") {
            date.disabled = false;
        }
    })
    const getTime = async () => {
        const { data, error } = await supabaseclient
            .from("doctors")
            .select("timing")
            .eq("doctor_name", doctor.value)
        if (error) {
            console.error(error);
            return error
        }
        console.log(JSON.parse(data[0].timing));
        return JSON.parse(data[0].timing)
    }
    date.addEventListener("change", async (event) => {
        const currentDate = new Date()
        const year = currentDate.toLocaleString("default", { year: "numeric" });
        const month = currentDate.toLocaleString("default", { month: "2-digit" });
        const day = currentDate.toLocaleString("default", { day: "2-digit" });
        const formattedDate = `${year}-${month}-${day}`;
        console.log(formattedDate)
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const selectedDay = weekdays[new Date(event.target.value).getDay()]
        console.log(selectedDay)
        const doctorDays = await getDay()
        if (event.target.value > formattedDate) {
            doctorDays.map(async (data) => {
                if (selectedDay == data) {
                    console.log("matched");
                    time.disabled = false
                    const doctorTime = await getTime()
                    doctorTime.map((data) => {
                        console.log(data);
                        time.innerHTML += `
                    <option value="${data}" >${data}</option>
                    `
                        confirmBtn.disabled = false
                    })
                }
            })
        }
    })
    confirmBtn.addEventListener("click", async () => {
        const { data, error } = await supabaseclient
            .from('appointments')
            .insert({
                patient_name: patientName.value,
                email: email.value,
                phone: phone.value,
                doctor_name: doctor.value,
                specialty: specialty.value,
                date: date.value,
                time: time.value
            })
            .select()
        if (error) {
            console.error(error);
            return error
        }
        console.log(data);
        console.log(specialty.value, doctor.value, date.value, time.value, patientName.value, email.value, phone.value);
        window.location.reload()
        return data
    }
    )
}
if (window.location.pathname == "/my_appoint.html") {
    const container = document.getElementById('appointments-container');
    const checkSessionForAppointment = async () => {
        const getSession = await session()
        if (window.location.pathname == "/my_appoint.html" && !getSession.session) {
            window.location.href = "/login.html"
        } else if (getSession.session) {
            const apptEmail = getSession.session.user.user_metadata.email
            const apptName = getSession.session.user.user_metadata.name
            const intro = document.querySelector(".section-intro")
            intro.innerText = `Welcome back, ${apptName}. Here is your list of upcoming and past consultations.`
            const appointList = await getAppt(apptEmail)
            if (appointList.length) {
                container.innerHTML = ""
                appointList.map(data => { 
                    container.innerHTML += `
                    <div class="appoints-div">
                    <div class="dateTime">
                        <div class="date">
                        ${data.date}
                        </div>
                        <div class="time">
                                ${data.time}
                        </div>
                    </div>
                    <div class="apptDeatailsDiv">
                        <div class="about-doctor">
                            <div class="doctor">
                                <b>Doctor Name:</b>
                                ${data.doctor_name}
                            </div>
                            <div class="specialty">
                                <b>Specialist:</b>
                                ${data.specialty}
                            </div>
                        </div>
                        <hr>
                        <div class="about-patient">
                            <div class="patient">
                                <b>Patient Name:</b>
                                ${data.patient_name}
                            </div>
                            <div class="email">
                                <b>Email:</b>
                                ${data.email}
                            </div>
                            <div class="phone">
                                <b>Contact No:</b>
                                ${data.phone}
                            </div>
                        </div>
                    </div>
                    <button class="deleteBtn" id="${data.id}" ><i class="fa-solid fa-trash"></i>Cancel</button>
                </div>
                    `
                    document.getElementById(data.id).addEventListener("click", () => {
                        deletedata(data.id)
                    })
                })
            }
        }

    }
    checkSessionForAppointment()
    const getAppt = async (email) => {
        const { data, error } = await supabaseclient
            .from("appointments")
            .select("")
            .eq("email", email)
        if (error) {
            console.error(error);
            return error
        }
        console.log(data);
        return data
    }
};





