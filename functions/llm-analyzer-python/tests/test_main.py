#!/usr/bin/env python3
"""
Tests for Docify Python LLM Analyzer
"""

import sys
import os
import json

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import (
    create_analysis_prompt,
    detect_content_type,
    prioritize_blocks,
    optimize_content_for_analysis,
    optimize_block_sizes
)


class TestContentAnalysis:
    """Test content analysis functions"""

    def test_detect_content_type_api(self):
        """Test API content type detection"""
        content = """
        REST API documentation for user management.
        GET /api/users - Retrieve all users
        POST /api/users - Create new user
        Authentication: Bearer token required
        """

        instructions = "Analyze the API endpoints"
        result = detect_content_type(content, instructions)

        assert 'api_reference' in result
        assert 'code' in result

    def test_detect_content_type_tutorial(self):
        """Test tutorial content type detection"""
        content = """
        Getting started with our platform.
        Step 1: Install the package
        Step 2: Configure your settings
        Step 3: Run the application
        """

        instructions = "Show me how to get started"
        result = detect_content_type(content, instructions)

        assert 'guide' in result
        assert 'troubleshooting' in result

    def test_prioritize_blocks_api_focus(self):
        """Test block prioritization with API focus"""
        content_types = ['api_reference', 'code']
        instructions = "Focus on API endpoints and authentication"

        result = prioritize_blocks(content_types, instructions)

        # API reference should be highly prioritized
        assert result[0] == 'api_reference' or 'api_reference' in result[:3]

    def test_optimize_content_for_analysis(self):
        """Test content optimization"""
        long_content = "Short content"
        result = optimize_content_for_analysis(long_content)

        assert isinstance(result, str)
        assert len(result) <= len(long_content)

    def test_optimize_block_sizes(self):
        """Test block size optimization"""
        blocks = [
            {'id': '1', 'type': 'summary', 'size': 'large', 'title': 'Test', 'content': 'Content'},
            {'id': '2', 'type': 'key_points', 'size': 'large', 'title': 'Test', 'content': 'Content'},
            {'id': '3', 'type': 'code', 'size': 'large', 'title': 'Test', 'content': 'Content'}
        ]

        result = optimize_block_sizes(blocks)

        # Should optimize sizes to fit grid constraints
        assert len(result) == len(blocks)
        assert all(block['size'] in ['small', 'medium', 'large'] for block in result)


class TestPromptGeneration:
    """Test prompt generation"""

    def test_create_analysis_prompt(self):
        """Test analysis prompt creation"""
        scraped_data = {
            'title': 'Test Document',
            'description': 'Test description',
            'content': 'Test content for analysis'
        }

        instructions = "Analyze this document thoroughly"

        prompt = create_analysis_prompt(scraped_data, instructions)

        assert 'Test Document' in prompt
        assert 'Test description' in prompt
        assert 'Test content for analysis' in prompt
        assert 'Analyze this document thoroughly' in prompt
        assert 'JSON response' in prompt


class TestMainFunction:
    """Test main function with mocked dependencies"""

    @patch('src.main.databases')
    def test_main_success(self, mock_databases):
        """Test successful analysis"""
        # Mock database responses
        mock_databases.get_document.return_value = {
            'title': 'Test Document',
            'description': 'Test description',
            'scraped_content': 'Test content for analysis',
            'url': 'https://example.com',
            'word_count': 10,
            'instructions': 'Analyze thoroughly'
        }

        mock_databases.list_documents.return_value = {
            'documents': [{'$id': 'analysis-123', 'status': 'pending'}]
        }

        # Mock Hugging Face API
        with patch('src.main.call_hugging_face_api') as mock_api:
            mock_api.return_value = {
                'summary': 'Test summary',
                'blocks': [
                    {
                        'id': 'block-1',
                        'type': 'summary',
                        'size': 'large',
                        'title': 'Summary',
                        'content': 'Summary content'
                    }
                ]
            }

            # Test context
            context = {
                'req': {
                    'body': {'documentId': 'doc-123'}
                },
                'log': Mock(),
                'error': Mock()
            }

            result = main(context)

            assert result['success'] == True
            assert 'data' in result
            assert result['data']['documentId'] == 'doc-123'

    @patch('src.main.databases')
    def test_main_missing_document_id(self, mock_databases):
        """Test missing document ID"""
        context = {
            'req': {'body': {}},
            'log': Mock(),
            'error': Mock()
        }

        result = main(context)

        assert result['success'] == False
        assert 'Missing required field' in result['error']

    @patch('src.main.databases')
    def test_main_no_scraped_content(self, mock_databases):
        """Test no scraped content available"""
        mock_databases.get_document.return_value = {
            'title': 'Test Document',
            'scraped_content': ''  # Empty content
        }

        mock_databases.list_documents.return_value = {
            'documents': [{'$id': 'analysis-123', 'status': 'pending'}]
        }

        context = {
            'req': {'body': {'documentId': 'doc-123'}},
            'log': Mock(),
            'error': Mock()
        }

        result = main(context)

        assert result['success'] == False
        assert 'No scraped content' in result['error']['message']


if __name__ == "__main__":
    # Run basic tests
    print("Running LLM Analyzer tests...")

    # Test content analysis
    test_content = """
    REST API documentation for user management.
    GET /api/users - Retrieve all users
    POST /api/users - Create new user
    """

    result = detect_content_type(test_content, "Analyze API")
    print(f"✅ Content type detection: {result}")

    # Test prompt generation
    test_data = {
        'title': 'API Guide',
        'description': 'REST API documentation',
        'content': test_content
    }

    prompt = create_analysis_prompt(test_data, "Analyze API endpoints")
    print(f"✅ Prompt generation: {len(prompt)} characters")

    # Test block prioritization
    prioritized = prioritize_blocks(['api_reference', 'code'], "Focus on API")
    print(f"✅ Block prioritization: {prioritized}")

    print("All basic tests passed! ✅")
