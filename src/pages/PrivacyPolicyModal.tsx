import * as React from 'react';
import SimpleModal from '../../components/SimpleModal';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
    >
      <div className="space-y-4 text-gray-700">
        <p><strong>Last Updated:</strong> January 2026</p>
        
        <h4 className="font-bold text-lg text-gray-900">Information We Collect</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contact details (name, phone, address)</li>
          <li>Order and payment information</li>
          <li>Delivery preferences</li>
        </ul>

        <h4 className="font-bold text-lg text-gray-900">How We Use It</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process your brick orders</li>
          <li>Arrange delivery logistics</li>
          <li>Provide customer support</li>
          <li>Send order updates</li>
        </ul>

        <h4 className="font-bold text-lg text-gray-900">Data Protection</h4>
        <p>We protect your data with security measures. We don't share your personal info without consent.</p>

        <h4 className="font-bold text-lg text-gray-900">Your Rights</h4>
        <p>You can access, correct, or delete your data by contacting us.</p>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <p className="text-sm">Contact Support | Phone: +977-9851210449</p>
        </div>
      </div>
    </SimpleModal>
  );
};

export default PrivacyPolicyModal;