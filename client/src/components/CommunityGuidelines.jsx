import React, { useState } from 'react'
import { FaTimes, FaDownload, FaFileAlt } from 'react-icons/fa'

const CommunityGuidelines = ({ onClose }) => {
  const guidelines = {
    title: "UrbanSprout Community Guidelines",
    lastUpdated: "January 2024",
    sections: [
      {
        title: "🌱 Welcome to UrbanSprout Community",
        content: "Our community is a place where plant enthusiasts of all levels come together to share knowledge, experiences, and grow together. These guidelines help maintain a positive, helpful, and welcoming environment for everyone."
      },
      {
        title: "✅ What We Encourage",
        content: [
          "• Share your plant journey - successes and challenges",
          "• Ask questions, no matter how basic they seem",
          "• Offer helpful advice and constructive feedback",
          "• Post clear, relevant photos of your plants",
          "• Use appropriate hashtags to help others find your content",
          "• Celebrate others' achievements and milestones",
          "• Share plant care tips and techniques"
        ]
      },
      {
        title: "❌ What's Not Allowed",
        content: [
          "• Spam, promotional content, or excessive self-promotion",
          "• Harassment, bullying, or disrespectful behavior",
          "• Off-topic posts unrelated to plants and gardening",
          "• Sharing false or misleading plant care information",
          "• Posting inappropriate or offensive content",
          "• Selling plants or products without permission",
          "• Duplicate posts or excessive posting"
        ]
      },
      {
        title: "🏷️ Using Tags Properly",
        content: [
          "• Use 'Question' tag when seeking advice or help",
          "• Use 'Success Story' tag to share your achievements",
          "• Include relevant hashtags like #HerbGarden, #Succulents, etc.",
          "• Keep hashtags relevant to your post content",
          "• Maximum 5 hashtags per post for better readability"
        ]
      },
      {
        title: "📸 Photo Guidelines",
        content: [
          "• Share clear, well-lit photos of your plants",
          "• Include before/after photos for transformation posts",
          "• Respect copyright - only post photos you own",
          "• Keep photos relevant to your post content",
          "• Consider adding captions to explain what we're seeing"
        ]
      },
      {
        title: "💬 Community Interaction",
        content: [
          "• Be respectful in comments and discussions",
          "• Provide constructive feedback, not just criticism",
          "• Thank community members who help you",
          "• Report inappropriate content to moderators",
          "• Help newcomers feel welcome"
        ]
      },
      {
        title: "⚖️ Consequences",
        content: [
          "• First violation: Friendly reminder and education",
          "• Repeated violations: Temporary content restrictions",
          "• Serious violations: Account suspension or ban",
          "• We reserve the right to remove content that violates guidelines",
          "• Appeals can be made through our support system"
        ]
      },
      {
        title: "📞 Contact & Support",
        content: [
          "• Report issues: Use the report button on posts/comments",
          "• Technical support: Contact support@urbansprout.com",
          "• Suggestions: Share feedback in our monthly community threads",
          "• Moderators are here to help - don't hesitate to reach out"
        ]
      }
    ]
  }

  const handleDownloadPDF = () => {
    // In a real app, this would download an actual PDF file
    alert('PDF download feature would be implemented with a real PDF file')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <FaFileAlt className="text-green-600 text-xl" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{guidelines.title}</h2>
              <p className="text-sm text-gray-600">Last updated: {guidelines.lastUpdated}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
          <div className="prose max-w-none">
            {guidelines.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                {Array.isArray(section.content) ? (
                  <div className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <p key={itemIndex} className="text-gray-700 leading-relaxed">{item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                )}
              </div>
            ))}

            {/* Footer */}
            <div className="mt-12 p-6 bg-green-50 rounded-xl border border-green-200">
              <h4 className="font-bold text-green-800 mb-2">Thank you for being part of our community! 🌿</h4>
              <p className="text-green-700">
                By participating in UrbanSprout Community, you agree to follow these guidelines. 
                Together, we can create a thriving space where everyone can learn and grow their plant knowledge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityGuidelines

