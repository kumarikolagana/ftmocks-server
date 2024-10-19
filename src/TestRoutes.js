const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { processHAR } = require('../mockGenerator');

const getTests = async (req, res) => {
    console.log(req.url);
    // TODO: Implement the logic for handling GET requests to /api/v1/tests
    // This is a placeholder response
    const indexPath = path.join(process.env.MOCK_DIR, 'tests.json');
    try {
      const indexData = fs.readFileSync(indexPath, 'utf8');
      const parsedData = JSON.parse(indexData);
      
      // Map the data to a more suitable format for the response
      const formattedData = parsedData.map(item => ({
        id: item.id,
        name: item.name,
        mockFile: item.mockFile
      }));
  
      res.status(200).json(formattedData);
    } catch (error) {
      console.error('Error reading or parsing index.json:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteTest = async (req, res) => {
    const fs = require('fs');
    const path = require('path');
  
    const testId = req.params.id;
    const testsPath = path.join(process.env.MOCK_DIR, 'tests.json');
  
    try {
      let testsData = fs.readFileSync(testsPath, 'utf8');
      let tests = JSON.parse(testsData);
  
      const testIndex = tests.findIndex(test => test.id === testId);
      const filePath = path.join(process.env.MOCK_DIR, tests[testIndex].mockFile);
      const folderPath = path.join(process.env.MOCK_DIR, tests[testIndex].id);
      if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
      }
      if(fs.existsSync(folderPath)){
        fs.rmdirSync(folderPath, { recursive: true });
      }
      if (testIndex === -1) {
        return res.status(404).json({ error: 'Test not found' });
      }
  
      tests.splice(testIndex, 1);
  
      fs.writeFileSync(testsPath, JSON.stringify(tests, null, 2));
  
      res.status(200).json({ message: 'Test deleted successfully' });
    } catch (error) {
      console.error('Error deleting test:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

const createTest = async (req, res) => {
    console.log(req.body, req.url);
    const fs = require('fs');
    const path = require('path');
  
    // Read existing tests
    const testsPath = path.join(process.env.MOCK_DIR, 'tests.json');
    let tests = [];
    try {
      const testsData = fs.readFileSync(testsPath, 'utf8');
      tests = JSON.parse(testsData);
      const newTest = {
        id: uuidv4(),
        name: req.body.name,
        mockFile: []
      };
      tests.push(newTest);
      fs.writeFileSync(testsPath, JSON.stringify(tests, null, 2));
      
      res.status(201).json({
        message: "New test created successfully",
        test: newTest
      });
      return;
    } catch (error) {
      console.error('Error reading tests.json:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

const updateTest = async (req, res) => {
  const testId = req.params.id;
  const updatedTest = req.body;

  try {
    const testsPath = path.join(process.env.MOCK_DIR, 'tests.json');
    let testsData = JSON.parse(fs.readFileSync(testsPath, 'utf8'));   

    const testIndex = testsData.findIndex(test => test.id === testId);
    if (testIndex === -1) {
      return res.status(404).json({ error: 'Test not found' });
    }

    testsData[testIndex].name = updatedTest.name;

    fs.writeFileSync(testsPath, JSON.stringify(testsData, null, 2));

    res.status(200).json({ message: 'Test updated successfully' });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMockDataForTest = async (req, res) => {
  const testId = req.params.id;
  const testDataPath = path.join(process.env.MOCK_DIR, `test_${testId}.json`);

  try {
    // Read the mock data from the test-specific file
    const mockData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    // Read data from path attribute file names and assign as mockData
    const updatedMockData = mockData.map(item => {
      try {
        const fileContent = fs.readFileSync(item.path, 'utf8');
        return JSON.parse(fileContent);
      } catch (error) {
        console.error(`Error reading file ${item.path}:`, error);
        return item; // Return the original item if there's an error
      }
    });

    res.status(200).json(updatedMockData);
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to retrieve mock data' });
  }
};

const createMockDataForTest = async (req, res) => {
    const testId = req.params.id;
    const mockData = req.body;
    const testsPath = path.join(process.env.MOCK_DIR, 'tests.json');
  
    try {
      // Read and parse the tests.json file
      const testsData = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
      
      // Find the test with the given id
      const testIndex = testsData.findIndex(test => test.id === testId);
      
      if (testIndex === -1) {
        return res.status(404).json({ error: 'Test not found' });
      }
  
      // Generate a unique filename for the new mock data
      const fileName = `response_${Date.now()}.json`;
      const filePath = path.join(process.env.MOCK_DIR, fileName);
  
      // Write the mock data to the new file
      fs.writeFileSync(filePath, JSON.stringify(mockData, null, 2));
  
      testsData[testIndex].mockFile = fileName;
  
      // Save the updated tests data back to tests.json
      fs.writeFileSync(testsPath, JSON.stringify(testsData, null, 2));
  
      res.status(201).json({
        message: "Mock data added successfully",
        fileName: fileName
      });
    } catch (error) {
      console.error('Error adding mock data:', error);
      res.status(500).json({ error: 'Failed to add mock data' });
    }
  };

const deleteMockDataForTest = async (req, res) => {
  const testId = req.params.id;
  const mockId = req.params.mockId;
  
  try {
    const tetFilePath = path.join(process.env.MOCK_DIR, `test_${testId}.json`);
    
    // Read and parse the mock data file
    let mockData = JSON.parse(fs.readFileSync(tetFilePath, 'utf8'));
    
    // Remove the mock record with the given mockId
    mockData = mockData.filter(mock => mock.id !== mockId);
    
    // Write the updated mock data back to the file
    fs.writeFileSync(tetFilePath, JSON.stringify(mockData, null, 2));

    // Delete the mock file associated with the mockId
    const mockFileName = `mock_${mockId}.json`;
    const mockFilePath = path.join(process.env.MOCK_DIR, testId, mockFileName);
    
    if (fs.existsSync(mockFilePath)) {
      fs.unlinkSync(mockFilePath);
      console.log(`Deleted mock file: ${mockFilePath}`);
    } else {
      console.warn(`Mock file not found: ${mockFilePath}`);
    }

    res.status(200).json({ message: "Mock data deleted successfully" });
  } catch (error) {
    console.error('Error deleting mock data:', error);
    res.status(500).json({ error: 'Failed to delete mock data' });
  }
  };

const createHarMockDataForTest = async (req, res) => {
  const testId = req.params.id;
  const testsPath = path.join(process.env.MOCK_DIR, 'tests.json');

  if (!req.file) {
    return res.status(400).json({ error: 'No HAR file uploaded' });
  }

  try {
    // Read and parse the tests.json file
    const testsData = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
    
    // Find the test with the given id
    const testIndex = testsData.findIndex(test => test.id === testId);
    
    if (testIndex === -1) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const harFilePath = req.file.path;
    
    // Process the HAR file and create mock data
    await processHAR(harFilePath, process.env.MOCK_DIR, `test_${testId}.json`, testId);

    // Update the test's mockFile array with the new mock data file
    const mockFileName = `test_${testId}.json`;
    testsData[testIndex].mockFile = mockFileName;

    // Save the updated tests data back to tests.json
    fs.writeFileSync(testsPath, JSON.stringify(testsData, null, 2));

    // Clean up the uploaded HAR file
    fs.unlinkSync(harFilePath);

    res.status(201).json({
      message: "HAR file processed and mock data added successfully",
      fileName: mockFileName
    });
  } catch (error) {
    console.error('Error processing HAR file:', error);
    res.status(500).json({ error: 'Failed to process HAR file and add mock data' });
  }
};

const updateMockDataForTest = async (req, res) => {
  const { id, mockId } = req.params;
  const updatedMockData = req.body;

  try {
    const mockFilePath = path.join(process.env.MOCK_DIR, id,  `mock_${mockId}.json`);
    fs.writeFileSync(mockFilePath, JSON.stringify(updatedMockData, null, 2));
    updatedMockData.id = mockId;
    res.json(updatedMockData);
  } catch (error) {
    console.error('Error updating mock data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
    getTests,
    deleteTest,
    updateTest,
    createTest,
    getMockDataForTest,
    createMockDataForTest,
    deleteMockDataForTest,
    createHarMockDataForTest,
    updateMockDataForTest
};