import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { type FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import { isPast } from 'date-fns';
import { isProfane } from 'no-profanity';

import { isValidUsername } from '../../../shared/utils/validate';
import { blocklistedUsernames } from '../../../shared/config/constants';
import { schemas } from '../schemas';

let fiveMinuteLimit: Date;

/**
 * Validate an image url.
 *
 * @param picture The url to check.
 * @returns Whether the url is a picture with a valid protocol.
 */
export const isPictureWithProtocol = (picture?: string): boolean => {
  if (!picture) return false;
  try {
    const url = new URL(picture);
    return url.protocol == 'http:' || url.protocol == 'https:';
  } catch {
    return false;
  }
};

/**
 * Plugin for all endpoints related to user settings.
 *
 * @param fastify The Fastify instance.
 * @param _options Fastify options I guess?
 * @param done Callback to signal that the logic has completed.
 */
export const settingRoutes: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done
) => {
  // The order matters here, since we want to reject invalid cross site requests
  // before checking if the user is authenticated.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  fastify.addHook('onRequest', fastify.csrfProtection);
  fastify.addHook('onRequest', fastify.authenticateSession);

  function updateErrorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (error.validation) {
      void reply.code(400);
      void reply.send({ message: 'flash.wrong-updating', type: 'danger' });
    } else {
      fastify.errorHandler(error, request, reply);
    }
  }

  fastify.put(
    '/update-my-profileui',
    {
      schema: schemas.updateMyProfileUI,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            profileUI: {
              isLocked: req.body.profileUI.isLocked,
              showAbout: req.body.profileUI.showAbout,
              showCerts: req.body.profileUI.showCerts,
              showDonation: req.body.profileUI.showDonation,
              showHeatMap: req.body.profileUI.showHeatMap,
              showLocation: req.body.profileUI.showLocation,
              showName: req.body.profileUI.showName,
              showPoints: req.body.profileUI.showPoints,
              showPortfolio: req.body.profileUI.showPortfolio,
              showTimeLine: req.body.profileUI.showTimeLine
            }
          }
        });

        return {
          message: 'flash.privacy-updated',
          type: 'success'
        } as const;
      } catch (err) {
        // TODO: send to Sentry
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-email',
    {
      schema: {
        body: Type.Object({
          email: Type.String({ format: 'email' })
        }),
        response: {
          200: Type.Object({
            message: Type.Literal('flash.email-valid'),
            type: Type.Literal('success')
          }),
          204: Type.Object({
            message: Type.String(),
            type: Type.Literal('info')
          }),
          400: Type.Object({
            message: Type.String(),
            type: Type.Union([Type.Literal('danger'), Type.Literal('info')])
          }),
          500: Type.Object({
            message: Type.Literal('flash.wrong-updating'),
            type: Type.Literal('danger')
          })
        }
      },
      // We need to customize the responses to validation failures:
      attachValidation: true
    },
    async (req, reply) => {
      if (req.validationError) {
        void reply.code(400);
        return { message: 'Email format is invalid', type: 'danger' } as const;
      }

      const userEmail = await fastify.prisma.user.findUniqueOrThrow({
        where: { id: req.session.user.id },
        select: {
          email: true
        }
      });
      const newEmail = req.body.email.toLowerCase();
      const currentEmailFormated = userEmail.email.toLowerCase();
      const isSameEmail = newEmail === currentEmailFormated;
      if (isSameEmail) {
        void reply.code(400);
        return {
          type: 'info',
          message: `${newEmail} is already associated with this account.
You can update a new email address instead.`
        } as const;
      }

      if (!isPast(fiveMinuteLimit)) {
        const formattedLimitedTime = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'long'
        }).format(fiveMinuteLimit);
        return {
          type: 'info',
          message: `
        We have already sent an email confirmation request to ${newEmail}.
        ${formattedLimitedTime}`
        } as const;
      }
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            email: newEmail
          }
        });
        return { message: 'flash.email-valid', type: 'success' } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-theme',
    {
      schema: schemas.updateMyTheme,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            theme: req.body.theme
          }
        });

        return {
          message: 'flash.updated-themes',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-socials',
    {
      schema: schemas.updateMySocials,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            website: req.body.website,
            twitter: req.body.twitter,
            githubProfile: req.body.githubProfile,
            linkedin: req.body.linkedin
          }
        });

        return {
          message: 'flash.updated-socials',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-username',
    {
      schema: schemas.updateMyUsername,
      attachValidation: true
    },
    async (req, reply) => {
      try {
        const user = await fastify.prisma.user.findFirstOrThrow({
          where: { id: req.session.user.id }
        });

        const newUsernameDisplay = req.body.username.trim();
        const oldUsernameDisplay = user.usernameDisplay?.trim();

        const newUsername = newUsernameDisplay.toLowerCase();
        const oldUsername = user.username.toLowerCase();

        const usernameUnchanged =
          newUsername === oldUsername &&
          newUsernameDisplay === oldUsernameDisplay;

        if (usernameUnchanged) {
          void reply.code(400);
          return {
            message: 'flash.username-used',
            type: 'info'
          } as const;
        }

        if (req.validationError) {
          void reply.code(400);
          return {
            message: req.validationError.message,
            type: 'info'
          } as const;
        }

        const validation = isValidUsername(newUsername);

        if (!validation.valid) {
          void reply.code(400);
          return {
            // TODO(Post-MVP): custom validation errors.
            message: `Username ${newUsername} ${validation.error}`,
            type: 'info'
          } as const;
        }

        const isUserNameProfane = isProfane(newUsername);
        const onBlocklist = blocklistedUsernames.includes(newUsername);

        const usernameTaken =
          newUsername === oldUsername
            ? false
            : await fastify.prisma.user.count({
                where: { username: newUsername }
              });

        if (usernameTaken || isUserNameProfane || onBlocklist) {
          void reply.code(400);
          return {
            message: 'flash.username-taken',
            type: 'info'
          } as const;
        }

        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            username: newUsername,
            usernameDisplay: newUsernameDisplay
          }
        });

        return {
          message: 'flash.username-updated',
          type: 'success',
          username: newUsernameDisplay
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );
  fastify.put(
    '/update-my-about',
    {
      schema: schemas.updateMyAbout
    },
    async (req, reply) => {
      const hasProtocol = isPictureWithProtocol(req.body.picture);

      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            about: req.body.about,
            name: req.body.name,
            location: req.body.location,
            ...(hasProtocol && { picture: req.body.picture })
          }
        });

        return {
          message: 'flash.updated-about-me',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-keyboard-shortcuts',
    {
      schema: schemas.updateMyKeyboardShortcuts,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            keyboardShortcuts: req.body.keyboardShortcuts
          }
        });

        return {
          message: 'flash.keyboard-shortcut-updated',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-quincy-email',
    {
      schema: schemas.updateMyQuincyEmail,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            sendQuincyEmail: req.body.sendQuincyEmail
          }
        });

        return {
          message: 'flash.subscribe-to-quincy-updated',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-honesty',
    {
      schema: schemas.updateMyHonesty,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            isHonest: req.body.isHonest
          }
        });

        return {
          message: 'buttons.accepted-honesty',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-privacy-terms',
    {
      schema: schemas.updateMyPrivacyTerms,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            acceptedPrivacyTerms: true,
            sendQuincyEmail: req.body.quincyEmails
          }
        });

        return {
          message: 'flash.privacy-updated',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  fastify.put(
    '/update-my-portfolio',
    {
      schema: schemas.updateMyPortfolio,
      errorHandler: updateErrorHandler
    },
    async (req, reply) => {
      try {
        // TODO(Post-MVP): make all properties required in the schema and use
        // req.body.portfolio directly.
        const portfolio = req.body.portfolio.map(
          ({ id, title, url, description, image }) => ({
            id: id ? id : '',
            title: title ? title : '',
            url: url ? url : '',
            description: description ? description : '',
            image: image ? image : ''
          })
        );
        await fastify.prisma.user.update({
          where: { id: req.session.user.id },
          data: {
            portfolio
          }
        });

        return {
          message: 'flash.portfolio-item-updated',
          type: 'success'
        } as const;
      } catch (err) {
        fastify.log.error(err);
        void reply.code(500);
        return { message: 'flash.wrong-updating', type: 'danger' } as const;
      }
    }
  );

  done();
};
