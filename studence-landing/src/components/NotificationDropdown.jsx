import { Bell } from 'lucide-react';
import { useState } from 'react';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const notifications = [
    { id: 1, text: 'You got a reply on "DSA Doubt"' },
    { id: 2, text: 'Someone commented on your teammate search' },
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell />
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-peach text-brown text-xs rounded-full px-1">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded shadow z-10">
          {notifications.map((n) => (
            <div key={n.id} className="p-2 hover:bg-peach text-sm">
              {n.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
