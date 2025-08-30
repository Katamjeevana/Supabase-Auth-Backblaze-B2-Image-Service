const { supabase } = require('../config/supabase');

// OTP expiry settings (15 minutes)
const OTP_EXPIRY = 900; // 15 minutes in seconds

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate a simple 6-digit code
function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if user exists in your custom users table
async function checkUserExists(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  return { user: data, error };
}


async function getUserByAuthId(authUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  
  return { user: data, error };
}

// Controller functions
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists in our custom table
    const { user: existingUser, error: userError } = await checkUserExists(email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.headers.origin || 'http://localhost:3000'}/success`,
        data: { 
          otp_expiry: OTP_EXPIRY
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Create user in our custom table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          auth_user_id: data.user.id,
          email_confirmed: false
        }
      ]);

    if (insertError) {
      console.error('Error creating user in custom table:', insertError);
      // Don't fail the request - the auth user was created successfully
      console.log('Auth user created but custom user record failed');
    }

    res.status(201).json({
      message: `Account created successfully! Please check your email for confirmation. The verification link will expire in ${OTP_EXPIRY / 60} minutes.`,
      user: data.user,
      needsConfirmation: !data.user?.email_confirmed_at,
      otpExpiry: OTP_EXPIRY
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};;
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try Supabase login directly first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        
        if (error.message === 'Invalid login credentials') {
          return res.status(400).json({ 
            error: 'Invalid email or password. Please check your credentials.' 
          });
        }
        
        if (error.message.includes('email') || error.message.includes('confirm')) {
          return res.status(400).json({ 
            error: 'Please confirm your email address before logging in.' 
          });
        }
        
        return res.status(400).json({ error: error.message });
      }

      // Login successful - ensure user exists in our custom table
      try {
        const { user: customUser, error: userError } = await checkUserExists(email);
        
        if (userError || !customUser) {
          console.log('User not found in custom table, creating now...');
          // Create user in custom table
          await supabase
            .from('users')
            .insert([
              { 
                email, 
                auth_user_id: data.user.id,
                email_confirmed: data.user.email_confirmed_at !== null
              }
            ]);
        }
      } catch (dbError) {
        console.error('Error ensuring user in custom table:', dbError);
        // Continue anyway - the auth login was successful
      }

      console.log('Login successful for:', email);
      res.json({
        message: 'Login successful',
        user: data.user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      });

    } catch (supabaseError) {
      console.error('Supabase login communication error:', supabaseError);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in our custom table
    const { user: customUser, error: userError } = await checkUserExists(email);
    
    if (userError || !customUser) {
      return res.status(400).json({ error: 'User not found' });
    }

    // For test emails, return success immediately
    if (email.includes('@example.com') || email.includes('@test.com')) {
      // Update custom user as confirmed
      await supabase
        .from('users')
        .update({ email_confirmed: true })
        .eq('email', email);
        
      return res.json({ 
        message: 'Verification email sent successfully. (Test mode)',
        otpExpiry: OTP_EXPIRY
      });
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        data: {
          otp_expiry: OTP_EXPIRY
        }
      }
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: `Verification email resent successfully. Please check your inbox. The link will expire in ${OTP_EXPIRY / 60} minutes.`,
      otpExpiry: OTP_EXPIRY
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

 const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification error:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get user from our custom table
    const { data: customUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    // If user doesn't exist in custom table, create them automatically
    if (userError || !customUser) {
      console.log('Auto-creating user in custom table:', user.email);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            email: user.email,
            auth_user_id: user.id,
            email_confirmed: user.email_confirmed_at !== null
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error auto-creating user:', insertError);
        return res.status(403).json({ error: 'User not found in application database' });
      }
      
      return res.json({ 
        valid: true, 
        user: {
          id: newUser.id,
          email: newUser.email
        }
      });
    }

    res.json({ 
      valid: true, 
      user: {
        id: customUser.id,
        email: customUser.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Repair user account - ensures user exists in custom table
const repairUser = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Check if user already exists in our custom table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (userError || !existingUser) {
      // User doesn't exist in custom table, create them
      console.log('Repairing user account for:', user.email);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            email: user.email,
            auth_user_id: user.id,
            email_confirmed: user.email_confirmed_at !== null
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error repairing user account:', insertError);
        return res.status(500).json({ error: 'Failed to repair user account' });
      }
      
      return res.json({ 
        message: 'User account repaired successfully',
        user: newUser 
      });
    }
    
    // User already exists
    res.json({ 
      message: 'User account already exists',
      user: existingUser 
    });
    
  } catch (error) {
    console.error('Repair user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};





// Manual confirmation endpoint
const manualConfirm = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log('Attempting manual confirmation for:', email);
    
    // Check if user exists in our custom table
    const { user: existingUser, error: userError } = await checkUserExists(email);
    
    if (userError || !existingUser) {
      return res.status(400).json({ error: 'User not found. Please sign up first.' });
    }
    
    // Generate confirmation code
    const confirmationCode = generateConfirmationCode();
    
    // Store confirmation code with expiration (10 minutes)
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        confirmation_code: confirmationCode,
        confirmation_expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
      .eq('email', email);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to generate confirmation code' });
    }

    // In a real app, you would send this code via email
    // For development, we'll just return it
    res.json({ 
      message: 'Confirmation code generated',
      code: confirmationCode,
      expiry: '10 minutes'
    });
    
  } catch (error) {
    console.error('Manual confirmation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Verify manual confirmation code
const verifyManualConfirmation = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Check if user exists in our custom table
    const { user: existingUser, error: userError } = await checkUserExists(email);
    
    if (userError || !existingUser) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if code matches and hasn't expired
    if (existingUser.confirmation_code !== code) {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }

    if (new Date(existingUser.confirmation_expiry) < new Date()) {
      return res.status(400).json({ error: 'Confirmation code has expired' });
    }

    // Mark email as confirmed
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email_confirmed: true,
        confirmation_code: null,
        confirmation_expiry: null
      })
      .eq('email', email);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to confirm email' });
    }

    res.json({ message: 'Email confirmed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Test database connection
const testDBConnection = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ error: 'Database connection failed: ' + error.message });
    }
    
    res.json({ message: 'Database connection successful', data });
  } catch (error) {
    res.status(500).json({ error: 'Database test failed: ' + error.message });
  }
};

// Export controller functions
module.exports = {
  signup,
  login,
  resendVerification,
  verifyToken,
  manualConfirm,
  verifyManualConfirmation,
  testDBConnection,
  repairUser
};