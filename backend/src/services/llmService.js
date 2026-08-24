const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate pre-visit summary
const generatePreVisitSummary = async (symptoms) => {
  try {
    console.log('🤖 Generating pre-visit summary for symptoms:', symptoms);

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ No OpenAI API key found. Using mock response.');
      return getMockPreVisitSummary(symptoms);
    }

    const prompt = `
      Analyze these symptoms and return a JSON response with:
      1. urgency: "Low", "Medium", or "High"
      2. chief_complaint: Brief summary in 5-7 words
      3. suggested_questions: 3 questions the doctor should ask
      
      Symptoms: ${symptoms}
      
      Return ONLY valid JSON in this format:
      {
        "urgency": "Low/Medium/High",
        "chief_complaint": "Brief summary",
        "suggested_questions": ["Question 1", "Question 2", "Question 3"]
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a medical AI assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0].message.content;
    console.log('✅ Pre-visit summary generated');
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return getMockPreVisitSummary(symptoms);
    }
  } catch (error) {
    console.error('❌ Pre-visit summary error:', error.message);
    return getMockPreVisitSummary(symptoms);
  }
};

// Generate post-visit summary
const generatePostVisitSummary = async (doctorNotes, diagnosis, prescription) => {
  try {
    console.log('🤖 Generating post-visit summary...');

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ No OpenAI API key found. Using mock response.');
      return getMockPostVisitSummary(doctorNotes);
    }

    const prompt = `
      Convert these clinical notes into a patient-friendly summary.
      
      Doctor's Notes: ${doctorNotes}
      Diagnosis: ${diagnosis || 'Not specified'}
      Prescription: ${prescription || 'None'}
      
      Return a JSON with:
      1. summary: Patient-friendly explanation in simple language
      2. medication_schedule: Clear instructions for medication (if any)
      3. follow_up: Follow-up steps and when to return
      4. red_flags: What symptoms to watch for
      
      Return ONLY valid JSON in this format:
      {
        "summary": "Patient-friendly summary",
        "medication_schedule": "Medication instructions",
        "follow_up": "Follow-up steps",
        "red_flags": "Warning signs to watch for"
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a medical AI assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const content = response.choices[0].message.content;
    console.log('✅ Post-visit summary generated');
    
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return getMockPostVisitSummary(doctorNotes);
    }
  } catch (error) {
    console.error('❌ Post-visit summary error:', error.message);
    return getMockPostVisitSummary(doctorNotes);
  }
};

// Mock responses (fallback if API fails)
const getMockPreVisitSummary = (symptoms) => {
  console.log('📝 Using mock pre-visit summary');
  return {
    urgency: 'Medium',
    chief_complaint: `Patient reports: ${symptoms.substring(0, 50)}...`,
    suggested_questions: [
      'How long have you had these symptoms?',
      'What makes the symptoms better or worse?',
      'Have you taken any medication for this?'
    ]
  };
};

const getMockPostVisitSummary = (doctorNotes) => {
  console.log('📝 Using mock post-visit summary');
  return {
    summary: `Based on your visit, ${doctorNotes.substring(0, 100)}... Please follow the recommended care plan.`,
    medication_schedule: 'Take prescribed medication as directed by your doctor.',
    follow_up: 'Please schedule a follow-up appointment in 1-2 weeks.',
    red_flags: 'Seek immediate medical attention if symptoms worsen or you experience difficulty breathing.'
  };
};

module.exports = {
  generatePreVisitSummary,
  generatePostVisitSummary
};