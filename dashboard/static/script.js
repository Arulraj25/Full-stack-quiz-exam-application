async function loadDashboard(){

    try{


        const response = await fetch("/api/dashboard");


        const data = await response.json();


        console.log(data);



        document.getElementById("totalUsers").innerText =
            data.total_users;


        document.getElementById("totalQuizzes").innerText =
            data.total_quizzes;


        document.getElementById("totalQuestions").innerText =
            data.total_questions;


        document.getElementById("attempts").innerText =
            data.total_attempts;


        document.getElementById("completed").innerText =
            data.completed_attempts;


        document.getElementById("abandoned").innerText =
            data.abandoned_attempts;


        document.getElementById("avgScore").innerText =
            data.overall_avg_score;



    }

    catch(error){

        console.log(
            "Dashboard Error:",
            error
        );

    }

}



// ONLY ONE CALL
document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);