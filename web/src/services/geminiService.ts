import axios from 'axios';
import { API_URL } from '../config';

/**
 * Interface for standardized AI responses from the backend.
 */
export interface AIResponse<T> {
    success: boolean;
    data: T;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    message?: string;
}

export const geminiService = {
    /**
     * Generate a technical product description.
     */
    generateDescription: async (productName: string, category: string): Promise<string> => {
        try {
            const { data } = await axios.post<AIResponse<{ text: string }>>(`${API_URL}/ai/generate-description`, { 
                productName, 
                category 
            });
            
            if (!data.success) throw new Error(data.message || 'Failed to generate description');
            return data.data.text;
        } catch (err: any) {
            console.error('Gemini Service Error:', err.message);
            throw new Error(err.response?.data?.message || 'The AI assistant is temporarily unavailable.');
        }
    },

    /**
     * Suggest troubleshooting or assembly steps for a guide.
     */
    suggestSteps: async (guideTitle: string, productContext?: string): Promise<string[]> => {
        try {
            const { data } = await axios.post<AIResponse<{ steps: string[] }>>(`${API_URL}/ai/suggest-steps`, { 
                guideTitle,
                productContext
            });
            
            if (!data.success) throw new Error(data.message || 'Failed to suggest steps');
            return data.data.steps;
        } catch (err: any) {
            console.error('Gemini Service Error:', err.message);
            throw new Error(err.response?.data?.message || 'Failed to get AI suggestions.');
        }
    },

    /**
     * Analyze customer feedback for sentiment and improvements.
     */
    analyzeFeedback: async (feedbackId: string): Promise<any> => {
        try {
            const { data } = await axios.get<AIResponse<any>>(`${API_URL}/ai/analyze-feedback/${feedbackId}`);
            
            if (!data.success) throw new Error(data.message || 'Failed to analyze feedback');
            return data.data;
        } catch (err: any) {
            console.error('Gemini Service Error:', err.message);
            throw new Error(err.response?.data?.message || 'Feedback analysis failed.');
        }
    }
};
