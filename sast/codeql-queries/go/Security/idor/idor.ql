// IDOR detection (Go - simple pattern-based)
// Looks for functions that read request-supplied IDs from Gin context (Param/Query/etc.)
// and also call GORM/DB accessors (First/Where/Find/Raw/etc.) in the same function
// without an obvious authorization check. This is a conservative, pattern-based
// detector intended to find likely Insecure Direct Object Reference (IDOR)
// candidates. It is not full taint-tracking; use as a first-pass and refine
// with a taint-tracking rule if you need higher precision.

import go
import DataFlow

// Pattern-based IDOR finder (DataFlow-based)
//
// This version uses DataFlow::CallNode to resolve call targets and to
// map call sites back to their enclosing callable. Using call-node
// predicates is more robust than calling non-existent AST methods on
// CallExpr (such as getCallee()/getEnclosingCallable()).
from Function f, DataFlow::CallNode paramCallNode, DataFlow::CallNode dbCallNode
where
  // request-derived parameter reads from gin.Context (e.g. c.Param("id"))
  exists(Method pm |
    paramCallNode.getTarget() = pm and
    pm.getName() in ["Param", "Query", "PostForm", "DefaultQuery", "FormValue"] and
    exists(Expr pe |
      paramCallNode.asExpr() = pe and
      pe.getLocation().getFile() = f.getLocation().getFile() and
      pe.getLocation().getStartLine() >= f.getLocation().getStartLine() and
      pe.getLocation().getEndLine() <= f.getLocation().getEndLine()
    )
  ) and

  // DB accessors commonly used in GORM chains
  exists(Method dm |
    dbCallNode.getTarget() = dm and
    dm.getName() in ["First", "Find", "Take", "Where", "Raw", "Exec", "Delete", "Updates"] and
    exists(Expr de |
      dbCallNode.asExpr() = de and
      de.getLocation().getFile() = f.getLocation().getFile() and
      de.getLocation().getStartLine() >= f.getLocation().getStartLine() and
      de.getLocation().getEndLine() <= f.getLocation().getEndLine()
    )
  ) and

  // no obvious authorization/ownership check in the same function
  not exists(DataFlow::CallNode authNode |
    exists(Method am |
      authNode.getTarget() = am and
      am.getName() in ["Authorize", "RequireOwner", "CheckOwner", "EnsureOwner", "IsOwner", "RequireOwnership"] and
      exists(Expr ae |
        authNode.asExpr() = ae and
        ae.getLocation().getFile() = f.getLocation().getFile() and
        ae.getLocation().getStartLine() >= f.getLocation().getStartLine() and
        ae.getLocation().getEndLine() <= f.getLocation().getEndLine()
      )
    )
  )

select f, "Possible IDOR: this function reads a request parameter and performs DB access in the same function without an obvious authorization check. Inspect the flow and ownership checks."
