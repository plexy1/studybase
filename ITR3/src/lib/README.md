# studybase
*Note -- Loose files in Git are NOT part of current finished ITR. they are to help us test a current build!

studybase is a powerful and dynamic study assistant designed to help university students streamline their academic journey. Currently tailored for York University students, this tool provides several unique features such as a personalized roadmap, professor search, quiz generation, and course content reviews. The platform is scalable and is not limited to York University; future expansions may include broader functionalities for students from various institutions.

## Features

- **Custom Roadmap Generator**: Powered by a custom GPT model, StudyBase generates a personalized roadmap to help students plan and manage their study schedule effectively. 
- **Custom Course Search**: Find professors and roadmaps for specific courses. Easily filter based on preferences and other criteria.
- **Quiz Generator**: Automatically generate quizzes for various course topics to help students test their knowledge and prepare for exams.
- **Professor Reviews**: Access valuable student reviews and feedback on professors to make informed decisions when selecting courses and instructors.
- **RateMyProfessor Integration**: View professor ratings from RateMyProfessor directly within the course selection interface.

## Technologies Used

- **YouTube API**: Integrated for accessing supplementary educational content and lectures.
- **Custom GPT API**: Tailored to provide personalized academic recommendations and support for students, such as generating study plans, quizzes, and more.
- **Google API**: Used for various features, including authentication and search functionality.
- **Firebase & Cloud Firestore**: Utilized for storing user data, professor reviews, and other dynamic content.
- **RateMyProfessor API**: Integrated to provide professor ratings and reviews directly within the application.

## Installation

Clone this repository to your local machine:

```bash
git clone https://github.com/plexy1/studybase.git
cd studybase
```

Install the required dependencies:

```bash
npm install
```

## Setting up RateMyProfessor Integration

The RateMyProfessor integration requires the `ratemyprofessor-api` package which is included in the dependencies. To run the server component:

```bash
node rateMyProfessor.js
```

This will start the API server on port 3000, which the frontend will use to fetch professor ratings.

## Access the Service (current state is pre-alpha)
``https://plexy1.github.io/studybase/index.html``
(This is not the final address for our service.)
