/**
 * Fluent Test Data Builder for Users
 * 
 * Provides a readable, composable way to create test user data for various scenarios.
 */

import type { User, UserRole } from '../../shared/types/service-interfaces.js';

export class UserBuilder {
  private user: Partial<User> = {};

  /**
   * Creates a basic valid user with minimal required fields
   */
  static create(): UserBuilder {
    return new UserBuilder()
      .withDiscordId('123456789012345678')
      .withUsername('testuser')
      .withEmail('test@example.com')
      .withRole('user')
      .active();
  }

  /**
   * Creates a shop owner user
   */
  static shopOwner(): UserBuilder {
    return UserBuilder.create()
      .withUsername('ShopKeeper')
      .withEmail('shop@example.com')
      .withShopName('Diamond District')
      .withRole('shop_owner');
  }

  /**
   * Creates a moderator user
   */
  static moderator(): UserBuilder {
    return UserBuilder.create()
      .withUsername('ModeratorUser')
      .withEmail('mod@example.com')
      .withRole('moderator');
  }

  /**
   * Creates an admin user
   */
  static admin(): UserBuilder {
    return UserBuilder.create()
      .withUsername('AdminUser')
      .withEmail('admin@example.com')
      .withRole('admin');
  }

  // Builder methods for fluent construction

  withDiscordId(discordId: string): UserBuilder {
    this.user.discordId = discordId;
    return this;
  }

  withUsername(username: string): UserBuilder {
    this.user.username = username;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }

  withAvatarUrl(avatarUrl: string): UserBuilder {
    this.user.avatarUrl = avatarUrl;
    return this;
  }

  withShopName(shopName: string): UserBuilder {
    this.user.shopName = shopName;
    return this;
  }

  withRole(role: UserRole): UserBuilder {
    this.user.role = role;
    return this;
  }

  active(): UserBuilder {
    this.user.isActive = true;
    return this;
  }

  inactive(): UserBuilder {
    this.user.isActive = false;
    return this;
  }

  // Validation test helpers - create invalid data for specific test scenarios

  withInvalidDiscordId(): UserBuilder {
    this.user.discordId = '';
    return this;
  }

  withEmptyUsername(): UserBuilder {
    this.user.username = '';
    return this;
  }

  withWhitespaceUsername(): UserBuilder {
    this.user.username = '   ';
    return this;
  }

  withInvalidEmail(): UserBuilder {
    this.user.email = 'invalid-email';
    return this;
  }

  withNullRole(): UserBuilder {
    this.user.role = null as any;
    return this;
  }

  // Business scenario helpers

  /**
   * Creates a user that can create items
   */
  canCreateItems(): UserBuilder {
    return this.withRole('shop_owner').active();
  }

  /**
   * Creates a user that can moderate reports
   */
  canModerate(): UserBuilder {
    return this.withRole('moderator').active();
  }

  /**
   * Creates a user for authentication testing
   */
  forAuthentication(): UserBuilder {
    return this.withDiscordId('987654321098765432')
      .withUsername('AuthTestUser')
      .withEmail('auth@test.com')
      .active();
  }

  /**
   * Build the final user object
   */
  build(): Partial<User> {
    return { ...this.user };
  }

  /**
   * Build and return the user ready for creation (without ID/timestamps)
   */
  buildForCreation(): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    const user = this.build();
    return {
      discordId: user.discordId || 'default_discord_id',
      username: user.username || 'DefaultUser',
      email: user.email,
      avatarUrl: user.avatarUrl,
      shopName: user.shopName,
      role: user.role || 'user',
      isActive: user.isActive ?? true
    };
  }
}

/**
 * Collection of pre-built users for common test scenarios
 */
export const TestUsers = {
  // Basic users
  basicUser: () => UserBuilder.create(),
  shopOwner: () => UserBuilder.shopOwner(),
  moderator: () => UserBuilder.moderator(),
  admin: () => UserBuilder.admin(),
  
  // Specific scenarios
  activeShopOwner: () => UserBuilder.shopOwner().active(),
  inactiveUser: () => UserBuilder.create().inactive(),
  userWithShop: () => UserBuilder.create().withShopName('Test Shop'),
  
  // Invalid users for validation testing
  invalidDiscordId: () => UserBuilder.create().withInvalidDiscordId(),
  emptyUsername: () => UserBuilder.create().withEmptyUsername(),
  whitespaceUsername: () => UserBuilder.create().withWhitespaceUsername(),
  invalidEmail: () => UserBuilder.create().withInvalidEmail(),
  
  // Business scenario users
  itemCreator: () => UserBuilder.create().canCreateItems(),
  reportModerator: () => UserBuilder.create().canModerate(),
  authUser: () => UserBuilder.create().forAuthentication()
};

/**
 * Validation test case generator for users
 */
export function createUserValidationCases() {
  return [
    {
      name: 'empty Discord ID',
      data: TestUsers.invalidDiscordId().build(),
      expectedError: { type: 'UserValidationError', code: 'INVALID_DISCORD_ID', message: 'Discord ID is required' }
    },
    {
      name: 'empty username',
      data: TestUsers.emptyUsername().build(),
      expectedError: { type: 'UserValidationError', code: 'INVALID_USERNAME', message: 'Username is required' }
    },
    {
      name: 'whitespace-only username',
      data: TestUsers.whitespaceUsername().build(),
      expectedError: { type: 'UserValidationError', code: 'INVALID_USERNAME', message: 'Username is required' }
    },
    {
      name: 'invalid email format',
      data: TestUsers.invalidEmail().build(),
      expectedError: { type: 'UserValidationError', code: 'INVALID_EMAIL', message: 'Invalid email format' }
    }
  ];
}