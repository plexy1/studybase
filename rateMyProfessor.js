const express = require('express');
const cors = require('cors');
const rmp = require('ratemyprofessor-api');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const UCB_SCHOOL_ID = '1072'; // UCB School ID for University of California Berkeley

// Endpoint to search for a professor and get their ratings
app.get('/api/professor-rating', async (req, res) => {
  try {
    const { professorName } = req.query;
    
    if (!professorName) {
      return res.status(400).json({ error: 'Professor name is required' });
    }

    // Get school data
    const school = await rmp.searchSchool("University of California Berkeley");
    
    if (!school || school.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    const schoolId = school[0].node.id;
    
    // Get professor rating
    const professorRating = await rmp.getProfessorRatingAtSchoolId(
      professorName,
      schoolId
    );
    
    if (!professorRating) {
      return res.status(404).json({ error: 'Professor not found' });
    }
    
    res.json(professorRating);
  } catch (error) {
    console.error('Error fetching professor rating:', error);
    res.status(500).json({ error: 'Failed to fetch professor rating' });
  }
});

// Endpoint to search for professors at a school
app.get('/api/search-professors', async (req, res) => {
  try {
    const { professorName } = req.query;
    
    if (!professorName) {
      return res.status(400).json({ error: 'Professor name is required' });
    }

    // Get school data
    const school = await rmp.searchSchool("University of California Berkeley");
    
    if (!school || school.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    const schoolId = school[0].node.id;
    
    // Search for professors
    const professors = await rmp.searchProfessorsAtSchoolId(
      professorName,
      schoolId
    );
    
    res.json(professors);
  } catch (error) {
    console.error('Error searching professors:', error);
    res.status(500).json({ error: 'Failed to search professors' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 