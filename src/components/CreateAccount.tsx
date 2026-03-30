import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import privateImg from "../assets/private.png";
import subtract from "../assets/subtract.png";
import supabase from "../lib/supabase";

const CreateAccountPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      const userData = {
        id: data.user?.id,
        email: data.user?.email,
        firstName: data.user?.user_metadata?.first_name || firstName,
        lastName: data.user?.user_metadata?.last_name || lastName,
      };

      localStorage.setItem('user', JSON.stringify(userData));

      // also insert into employees table so settings can fetch it later
      try {
        await import('../lib/supabaseService').then(mod => {
          const { employeesService } = mod;
          if (userData.email) {
            employeesService.createEmployee({
              email: userData.email,
              role: 'User',
              first_name: userData.firstName,
              last_name: userData.lastName,
              date_of_birth: '',
              job_title: '',
              cell_phone: '',
              send_text_notification: false,
              additional_notes: '',
            }).catch(err => console.error('Failed to create employee on signup:', err));
          }
        });
      } catch {}

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }

      setSuccess('Account created successfully! Please check your email to confirm your account.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

      return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side – Background Image */}
      <div className="relative hidden md:block md:w-1/2 bg-black min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${privateImg})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-6 sm:p-12 text-white">
          <div>
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-3 text-white">
              <img src={subtract} alt="Axiom Tracker Logo" className="w-6 h-6 sm:w-8 sm:h-8 invert" />
              <span className="hidden md:block text-lg sm:text-xl font-semibold">Axiom Tracker</span>
            </div>
            <Link to="/" className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white flex items-center gap-2 cursor-pointer">
              <span className="text-lg">←</span>
              <p className="hidden md:block underline text-xs sm:text-sm">Back to Website</p>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold leading-tight">
            Never Miss Your Credential
            <br />
            Renewal Again.
          </h1>
        </div>
      </div>

      {/* Right Side – Form */} 
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-12"> 
      <div className="w-full max-w-md space-y-6 sm:space-y-10"> 
       
        {/* Title & subtitle – exact */} 
        <div> 
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900">Create Account</h2> 
        <p className="mt-2 text-sm sm:text-sm md:text-base text-gray-600"> Sign up to manage and access your credentials securely. </p> 
        </div> 
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6"> 
         
          {/* First Name / Last Name */} 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4"> 
            <div>
               <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"> First Name </label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter your first name" className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-sm" /> 
                </div>
                 <div> 
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"> Last Name </label>
                   <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter your last name" className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-sm" /> 
                   </div>
                    </div> 

                    {/* Email */}
                     <div> 
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"> Email </label> 
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-sm" /> 
                      </div>
                      
                       {/* Password */} 
                       <div> 
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"> Password </label>
                         <div className="relative">
                           <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-sm pr-10" />
                           <button
                             type="button"
                             onClick={() => setShowPassword(!showPassword)}
                             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                             title={showPassword ? "Hide password" : "Show password"}
                           >
                             {showPassword ? (
                               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                               </svg>
                             ) : (
                               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                               </svg>
                             )}
                           </button>
                         </div>
                         <p className="mt-1 text-xs text-gray-500"> Password must include at least 8 characters, including numbers and symbols </p> 
                         </div> 

                         {/* Submit */} 
                         <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-3 md:py-4 bg-black text-white text-sm sm:text-base md:text-lg font-medium rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed" > {loading ? 'Creating Account...' : 'Create Account'}
                           </button>
                            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}
                            </div>}
                             {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}
                            </div>}

                            {/* Remember Me Checkbox */}
                            <label className="inline-flex items-center gap-2 text-xs sm:text-sm">
                              <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4"
                              />
                              <span>Remember me</span>
                            </label>
                             </form>
                             
                              {/* Footer link – exact text */}
                               <div className="text-center text-xs sm:text-sm text-gray-600"> Already have an account?{' '}
                                 <Link to="/login" className="font-semibold text-black hover:underline"> Login
                                   </Link>
                                    </div>
                                    </div> 
                                    </div>
                                     </div> 
                                     );
                                     };
                                      export default CreateAccountPage;