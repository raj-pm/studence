import { Bell, XCircle } from 'lucide-react'; // Added XCircle for "mark as read"
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { useUser } from '../UserContext'; // Import useUser to get current user's UID and token

export default function NotificationDropdown() {
  const { user } = useUser(); // Get user from context
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null); // Ref for closing dropdown on outside click

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || !user.token || !user.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use the new notification route
      const res = await fetch(`http://localhost:3000/api/notifications`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        console.error("Failed to fetch notifications:", res.statusText);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Initial fetch when component mounts or user changes

    // Close dropdown if clicked outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]); // Re-fetch when user changes (login/logout)

  const unreadCount = notifications.filter(n => !n.read).length;

  // Function to mark a single notification as read (or all)
  const markNotificationAsRead = async (notificationId = null) => {
    if (!user || !user.token || !user.uid) {
      alert("Please log in to mark notifications.");
      return;
    }

    try {
      let endpoint = `http://localhost:3000/api/notifications/mark-as-seen`;
      if (notificationId) {
        endpoint += `/${notificationId}`; // If marking a single one
      }

      const res = await fetch(endpoint, {
        method: 'PUT', // Or PATCH
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ userId: user.uid }) // Send userId for backend verification
      });

      if (res.ok) {
        // Update frontend state immediately
        if (notificationId) {
          setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
      } else {
        const errorData = await res.json();
        console.error("Failed to mark notification as read:", errorData.error);
        alert("Failed to mark notification as read.");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      alert("An error occurred while marking notification.");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
        <Bell className="w-6 h-6 text-[#7b3f00]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-[#f1e2d1] z-10 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-[#f1e2d1] flex justify-between items-center">
            <h3 className="font-bold text-[#7b3f00]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markNotificationAsRead()} // Mark all as read
                className="text-sm text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-3 text-gray-600 text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-3 text-gray-600 text-sm">No new notifications.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`p-3 border-b border-[#f1e2d1] last:border-b-0 flex items-start gap-2 ${!n.read ? 'bg-[#fff8f3]' : 'bg-white'}`}>
                <MessageSquare className="w-5 h-5 text-[#d89566] mt-1 flex-shrink-0" /> {/* Generic icon, could be dynamic */}
                <div className="flex-1">
                  <p className={`text-sm ${!n.read ? 'font-semibold text-[#7b3f00]' : 'text-gray-700'}`}>
                    {n.content_preview}
                  </p>
                  <span className="text-xs text-gray-500 block mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markNotificationAsRead(n.id)}
                    className="ml-auto p-1 rounded-full hover:bg-gray-200 text-gray-500"
                    title="Mark as read"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
