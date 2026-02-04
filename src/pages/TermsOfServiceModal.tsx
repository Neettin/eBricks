import * as React from 'react';
import SimpleModal from '../../components/SimpleModal';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms of Service"
    >
      <div className="space-y-4 text-gray-700">
        <p><strong>Effective:</strong> January 2024</p>
        
        <h4 className="font-bold text-lg text-gray-900">Order Rules</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>1 Truck = 2,000 Bricks standard load</li>
          <li>Delivery inside Ring Road area only after 7 pm</li>
          <li>Prices in NPR, taxes included</li>
          <li>Inspect bricks on delivery</li>
        </ul>

        <h4 className="font-bold text-lg text-gray-900">Payment</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cash on delivery available</li>
          <li>Bank transfer accepted</li>
          <li>Full payment may be required for bulk orders</li>
        </ul>

        <h4 className="font-bold text-lg text-gray-900">No Returns & Refunds Policy</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Report issues within 24 hours</li>
        </ul>

        <h4 className="font-bold text-lg text-gray-900">Responsibilities</h4>
        <p>Provide accurate delivery information. Ensure vehicle access.</p>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <p className="text-sm">Contact Support | Phone: +977-9851210449</p>
          <p className="text-xs mt-2">By using our service, you agree to these terms.</p>
        </div>
      </div>
    </SimpleModal>
  );
};

export default TermsOfServiceModal;