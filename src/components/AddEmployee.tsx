import { useState } from "react";
import editIcon from "../assets/edit.png";

interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  lastLogin: string;
}

export default function AddEmployee({ onCancel, onSave, onUpdate, employee }: {
  onCancel?: () => void;
  onSave?: (employee: Employee) => void;
  onUpdate?: (employee: Employee) => void;
  employee?: Employee;
}) {
  const [formData, setFormData] = useState(() => {
    if (employee) {
      const [firstName, ...lastNameParts] = employee.name.split(' ');
      return {
        email: employee.email,
        role: employee.role,
        firstName: firstName,
        lastName: lastNameParts.join(' '),
        dateOfBirth: "",
        jobTitle: "",
        cellPhone: "",
        notes: "",
      };
    }
    return {
      email: "",
      role: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      jobTitle: "",
      cellPhone: "",
      notes: "",
    };
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updatedEmployee: Employee = {
      id: employee?.id || Date.now(),
      name: `${formData.firstName} ${formData.lastName}`,
      role: formData.role,
      email: formData.email,
      lastLogin: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    if (employee) {
      onUpdate?.(updatedEmployee);
    } else {
      onSave?.(updatedEmployee);
    }
    onCancel?.();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="text-lg font-semibold mb-6">{employee ? 'Edit Employee' : 'Add New Employee'}</h1>

      {/* Account Info */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-4">Account Information</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full"
              placeholder="Input email"
            />
            <img src={editIcon} alt="edit" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="bg-gray-100 px-4 py-3 rounded-md text-sm"
          >
            <option>Select role</option>
            <option value="Admin">Admin</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
      </section>

      {/* Personal Info */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-4">Personal Information</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full"
              placeholder="Input first name"
            />
            <img src={editIcon} alt="edit" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>
          <div className="relative">
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full"
              placeholder="Input last name"
            />
            <img src={editIcon} alt="edit" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="relative">
            <input
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full"
              placeholder="Input job title"
            />
            <img src={editIcon} alt="edit" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>
          <div className="relative">
            <input
              name="cellPhone"
              value={formData.cellPhone}
              onChange={handleInputChange}
              className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full"
              placeholder="Input cell phone"
            />
            <img src={editIcon} alt="edit" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Send Text Notification</label>
            <select className="bg-gray-100 px-4 py-3 rounded-md text-sm w-full cursor-pointer">
              <option>Select option</option>
              <option>Yes</option>
              <option>SNo</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="mb-6">
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          className="bg-gray-100 w-full px-4 py-3 rounded-md text-sm h-28"
          placeholder="Additional Notes"
        />
      </section>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="bg-gray-100 px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-100 px-6 py-3 rounded-md text-sm cursor-pointer hover:bg-black hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
