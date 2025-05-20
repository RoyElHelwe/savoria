import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserProfile,
  ProfileUpdateData,
  getProfile,
  updateProfile,
  updatePassword,
} from "../../services/profileService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import { Link } from "react-router-dom";

type TabType = "profile" | "security";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [formData, setFormData] = useState<ProfileUpdateData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await getProfile();
        setProfile(profileData);

        // Initialize form data with profile data
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile data"
        );
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password form input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset messages
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Check if data has changed
      const hasChanges = Object.keys(formData).some((key) => {
        const k = key as keyof ProfileUpdateData;
        return formData[k] !== (profile?.[k] || "");
      });

      if (!hasChanges) {
        setSuccess("No changes to save");
        setSaving(false);
        return;
      }

      // Remove empty fields to avoid overwriting with empty values
      const dataToUpdate: ProfileUpdateData = {};
      Object.keys(formData).forEach((key) => {
        const k = key as keyof ProfileUpdateData;
        if (
          formData[k] !== undefined &&
          formData[k] !== null &&
          formData[k] !== ""
        ) {
          dataToUpdate[k] = formData[k];
        }
      });

      // Update profile
      const updatedProfile = await updateProfile(dataToUpdate);

      // Update profile state
      setProfile(updatedProfile);

      // Update user context if needed
      if (updateUser) {
        updateUser({
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          email: updatedProfile.email,
          phone: updatedProfile.phone || "",
          address: updatedProfile.address || "",
        });
      }

      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);

      // Clear success message after a delay
      if (success) {
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset messages
    setPasswordError(null);
    setPasswordSuccess(null);
    setSaving(true);

    try {
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("New passwords do not match");
        setSaving(false);
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
        setSaving(false);
        return;
      }

      // Update password
      const result = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result) {
        setPasswordSuccess("Password updated successfully");
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password"
      );
      console.error("Error updating password:", err);
    } finally {
      setSaving(false);

      // Clear success message after a delay
      if (passwordSuccess) {
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">My Profile</h1>
      <p className="text-gray-600 mb-8">
        Manage your account information and password
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center mb-2 text-amber-800 text-3xl font-semibold">
                  {profile?.first_name?.[0] || profile?.username?.[0] || "U"}
                </div>
              </div>
              <CardTitle className="text-center">
                {profile?.first_name} {profile?.last_name}
              </CardTitle>
              <CardDescription className="text-center">
                @{profile?.username}
              </CardDescription>
              <div className="flex justify-center mt-1">
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-200 bg-amber-50"
                >
                  {profile?.role?.charAt(0)?.toUpperCase() ?? ""}
                  {profile?.role?.slice(1) ?? ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <div className="flex items-start">
                  <Mail className="h-4 w-4 mt-1 mr-2 text-gray-500" />
                  <span className="text-gray-700">{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 mt-1 mr-2 text-gray-500" />
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
                {profile?.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mt-1 mr-2 text-gray-500" />
                    <span className="text-gray-700">{profile.address}</span>
                  </div>
                )}
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mt-1 mr-2 text-gray-500" />
                  <span className="text-gray-700">
                    Member since {formatDate(profile?.created_at || "")}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-2xl font-semibold text-amber-600">
                    {profile?.stats?.total_orders || 0}
                  </div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-2xl font-semibold text-amber-600">
                    {profile?.stats?.total_reservations || 0}
                  </div>
                  <div className="text-xs text-gray-500">Reservations</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col space-y-2">
                <Link
                  to="/orders"
                  className="text-sm text-gray-700 hover:text-amber-600 flex items-center p-2 rounded-md hover:bg-amber-50 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  My Orders
                </Link>
                <Link
                  to="/reservations/my"
                  className="text-sm text-gray-700 hover:text-amber-600 flex items-center p-2 rounded-md hover:bg-amber-50 transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  My Reservations
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Settings */}
        <div className="md:col-span-2">
          <Tabs
            defaultValue="profile"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="flex-1">
                Profile Information
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleProfileSubmit}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="Your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address || ""}
                        onChange={handleInputChange}
                        placeholder="Your address"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="mr-2">Saving</span>
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handlePasswordSubmit}>
                  <CardContent className="space-y-4">
                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <p>{passwordError}</p>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <p>{passwordSuccess}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="mr-2">Updating</span>
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
