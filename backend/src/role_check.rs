use crate::types::{User, UserRole};

/// The diagram's RoleCheck: enforces the ADMIN / USER roles.
pub fn is_admin(user: &User) -> bool {
  matches!(user.role, UserRole::Admin)
}

pub fn is_user(user: &User) -> bool {
  matches!(user.role, UserRole::User)
}

pub fn require_role(user: &User, role: UserRole) -> Result<(), &'static str> {
  let has = match role {
    UserRole::Admin => is_admin(user),
    UserRole::User => is_user(user) || is_admin(user),
  };
  if has {
    Ok(())
  } else {
    Err("insufficient role")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn admin_passes_admin_check() {
    let mut user = User::get_dummy();
    user.role = UserRole::Admin;
    assert!(is_admin(&user));
    assert!(require_role(&user, UserRole::Admin).is_ok());
  }

  #[test]
  fn plain_user_fails_admin_check() {
    let mut user = User::get_dummy();
    user.role = UserRole::User;
    assert!(!is_admin(&user));
    assert!(require_role(&user, UserRole::Admin).is_err());
    // Admin-only resources are not user-only resources; plain user passes the user check.
    assert!(require_role(&user, UserRole::User).is_ok());
  }
}
