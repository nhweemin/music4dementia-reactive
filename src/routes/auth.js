import { v4 as uuidv4 } from 'uuid';
import Institute from '../models/Institute.js';
import { generateOTP, sendEmail } from '../utils/email.js';

export default async function authRoutes(fastify, options) {
  // Sign up
  fastify.post('/signup', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, name, password } = request.body;
    
    try {
      // Check if user already exists
      const existingInstitute = await Institute.findByEmail(email);
      if (existingInstitute) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'User with this email already exists'
        });
      }
      
      // Create new institute
      const institute = new Institute({
        email,
        name,
        password,
        isVerifyAuth: false
      });
      
      institute.generateUID();
      await institute.save();
      
      // Generate JWT token
      const token = fastify.jwt.sign({ 
        id: institute._id,
        email: institute.email,
        uid: institute.uid
      });
      
      // Generate and send OTP
      const otp = generateOTP();
      institute.otpResetPassword = otp;
      await institute.save();
      
      // Send verification email (async)
      sendEmail(email, 'signup', { otp, name }).catch(err => {
        fastify.log.error('Failed to send signup email:', err);
      });
      
      reply.code(201).send({
        success: true,
        message: 'Account created successfully. Please check your email for verification.',
        data: {
          institute: institute.toPublicJSON(),
          token
        }
      });
      
    } catch (error) {
      fastify.log.error('Signup error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create account'
      });
    }
  });
  
  // Sign in
  fastify.post('/signin', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;
    
    try {
      // Find institute
      const institute = await Institute.findByEmail(email);
      if (!institute) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }
      
      // Check password
      const isValidPassword = await institute.comparePassword(password);
      if (!isValidPassword) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }
      
      // Check if account is verified
      if (!institute.isVerifyAuth) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Account not verified. Please check your email for verification instructions.'
        });
      }
      
      // Update last login
      await institute.updateLastLogin();
      
      // Generate JWT token
      const token = fastify.jwt.sign({ 
        id: institute._id,
        email: institute.email,
        uid: institute.uid
      });
      
      reply.send({
        success: true,
        message: 'Login successful',
        data: {
          institute: institute.toPublicJSON(),
          token
        }
      });
      
    } catch (error) {
      fastify.log.error('Signin error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to sign in'
      });
    }
  });
  
  // Verify account
  fastify.post('/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', minLength: 6, maxLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, otp } = request.body;
    
    try {
      const institute = await Institute.findByEmail(email);
      if (!institute) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Institute not found'
        });
      }
      
      if (institute.otpResetPassword !== otp) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid OTP'
        });
      }
      
      // Verify account
      institute.isVerifyAuth = true;
      institute.otpResetPassword = null;
      await institute.save();
      
      reply.send({
        success: true,
        message: 'Account verified successfully'
      });
      
    } catch (error) {
      fastify.log.error('Verify error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to verify account'
      });
    }
  });
  
  // Request password reset
  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    const { email } = request.body;
    
    try {
      const institute = await Institute.findByEmail(email);
      if (!institute) {
        // Don't reveal if email exists
        return reply.send({
          success: true,
          message: 'If an account with this email exists, you will receive password reset instructions.'
        });
      }
      
      // Generate and send OTP
      const otp = generateOTP();
      institute.otpResetPassword = otp;
      await institute.save();
      
      // Send reset email (async)
      sendEmail(email, 'reset', { otp, name: institute.name }).catch(err => {
        fastify.log.error('Failed to send reset email:', err);
      });
      
      reply.send({
        success: true,
        message: 'If an account with this email exists, you will receive password reset instructions.'
      });
      
    } catch (error) {
      fastify.log.error('Forgot password error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to process password reset request'
      });
    }
  });
  
  // Reset password
  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'otp', 'newPassword'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', minLength: 6, maxLength: 6 },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, otp, newPassword } = request.body;
    
    try {
      const institute = await Institute.findByEmail(email);
      if (!institute) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Institute not found'
        });
      }
      
      if (institute.otpResetPassword !== otp) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid OTP'
        });
      }
      
      // Reset password
      institute.password = newPassword;
      institute.otpResetPassword = null;
      await institute.save();
      
      reply.send({
        success: true,
        message: 'Password reset successfully'
      });
      
    } catch (error) {
      fastify.log.error('Reset password error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to reset password'
      });
    }
  });
}

