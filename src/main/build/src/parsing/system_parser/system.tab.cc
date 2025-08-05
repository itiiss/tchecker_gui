// A Bison parser, made by GNU Bison 3.8.2.

// Skeleton implementation for Bison LALR(1) parsers in C++

// Copyright (C) 2002-2015, 2018-2021 Free Software Foundation, Inc.

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// As a special exception, you may create a larger work that contains
// part or all of the Bison parser skeleton and distribute that work
// under terms of your choice, so long as that work isn't itself a
// parser generator using the skeleton or a modified version thereof
// as a parser skeleton.  Alternatively, if you modify or redistribute
// the parser skeleton itself, you may (at your option) remove this
// special exception, which will cause the skeleton and the resulting
// Bison output files to be licensed under the GNU General Public
// License without this special exception.

// This special exception was added by the Free Software Foundation in
// version 2.2 of Bison.

// DO NOT RELY ON FEATURES THAT ARE NOT DOCUMENTED in the manual,
// especially those whose name start with YY_ or yy_.  They are
// private implementation details that can be changed or removed.


// Take the name prefix into account.
#define yylex   spyylex



#include "system.tab.hh"


// Unqualified %code blocks.
#line 45 "system.yy"

  // Declare the lexer for the parser's sake.
  tchecker::parsing::system::parser_t::symbol_type spyylex
  (std::string const & filename,
  std::shared_ptr<tchecker::parsing::system_declaration_t> & system_declaration);
  
  // Error detection
  static unsigned int old_error_count;

#line 58 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"


#ifndef YY_
# if defined YYENABLE_NLS && YYENABLE_NLS
#  if ENABLE_NLS
#   include <libintl.h> // FIXME: INFRINGES ON USER NAME SPACE.
#   define YY_(msgid) dgettext ("bison-runtime", msgid)
#  endif
# endif
# ifndef YY_
#  define YY_(msgid) msgid
# endif
#endif


// Whether we are compiled with exception support.
#ifndef YY_EXCEPTIONS
# if defined __GNUC__ && !defined __EXCEPTIONS
#  define YY_EXCEPTIONS 0
# else
#  define YY_EXCEPTIONS 1
# endif
#endif

#define YYRHSLOC(Rhs, K) ((Rhs)[K].location)
/* YYLLOC_DEFAULT -- Set CURRENT to span from RHS[1] to RHS[N].
   If N is 0, then set CURRENT to the empty location which ends
   the previous symbol: RHS[0] (always defined).  */

# ifndef YYLLOC_DEFAULT
#  define YYLLOC_DEFAULT(Current, Rhs, N)                               \
    do                                                                  \
      if (N)                                                            \
        {                                                               \
          (Current).begin  = YYRHSLOC (Rhs, 1).begin;                   \
          (Current).end    = YYRHSLOC (Rhs, N).end;                     \
        }                                                               \
      else                                                              \
        {                                                               \
          (Current).begin = (Current).end = YYRHSLOC (Rhs, 0).end;      \
        }                                                               \
    while (false)
# endif


// Enable debugging if requested.
#if SPYYDEBUG

// A pseudo ostream that takes yydebug_ into account.
# define YYCDEBUG if (yydebug_) (*yycdebug_)

# define YY_SYMBOL_PRINT(Title, Symbol)         \
  do {                                          \
    if (yydebug_)                               \
    {                                           \
      *yycdebug_ << Title << ' ';               \
      yy_print_ (*yycdebug_, Symbol);           \
      *yycdebug_ << '\n';                       \
    }                                           \
  } while (false)

# define YY_REDUCE_PRINT(Rule)          \
  do {                                  \
    if (yydebug_)                       \
      yy_reduce_print_ (Rule);          \
  } while (false)

# define YY_STACK_PRINT()               \
  do {                                  \
    if (yydebug_)                       \
      yy_stack_print_ ();                \
  } while (false)

#else // !SPYYDEBUG

# define YYCDEBUG if (false) std::cerr
# define YY_SYMBOL_PRINT(Title, Symbol)  YY_USE (Symbol)
# define YY_REDUCE_PRINT(Rule)           static_cast<void> (0)
# define YY_STACK_PRINT()                static_cast<void> (0)

#endif // !SPYYDEBUG

#define yyerrok         (yyerrstatus_ = 0)
#define yyclearin       (yyla.clear ())

#define YYACCEPT        goto yyacceptlab
#define YYABORT         goto yyabortlab
#define YYERROR         goto yyerrorlab
#define YYRECOVERING()  (!!yyerrstatus_)

#line 13 "system.yy"
namespace tchecker { namespace parsing { namespace system {
#line 151 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"

  /// Build a parser object.
  parser_t::parser_t (std::string const & filename_yyarg, std::shared_ptr<tchecker::parsing::system_declaration_t> & system_declaration_yyarg)
#if SPYYDEBUG
    : yydebug_ (false),
      yycdebug_ (&std::cerr),
#else
    :
#endif
      filename (filename_yyarg),
      system_declaration (system_declaration_yyarg)
  {}

  parser_t::~parser_t ()
  {}

  parser_t::syntax_error::~syntax_error () YY_NOEXCEPT YY_NOTHROW
  {}

  /*---------.
  | symbol.  |
  `---------*/



  // by_state.
  parser_t::by_state::by_state () YY_NOEXCEPT
    : state (empty_state)
  {}

  parser_t::by_state::by_state (const by_state& that) YY_NOEXCEPT
    : state (that.state)
  {}

  void
  parser_t::by_state::clear () YY_NOEXCEPT
  {
    state = empty_state;
  }

  void
  parser_t::by_state::move (by_state& that)
  {
    state = that.state;
    that.clear ();
  }

  parser_t::by_state::by_state (state_type s) YY_NOEXCEPT
    : state (s)
  {}

  parser_t::symbol_kind_type
  parser_t::by_state::kind () const YY_NOEXCEPT
  {
    if (state == empty_state)
      return symbol_kind::S_YYEMPTY;
    else
      return YY_CAST (symbol_kind_type, yystos_[+state]);
  }

  parser_t::stack_symbol_type::stack_symbol_type ()
  {}

  parser_t::stack_symbol_type::stack_symbol_type (YY_RVREF (stack_symbol_type) that)
    : super_type (YY_MOVE (that.state), YY_MOVE (that.location))
  {
    switch (that.kind ())
    {
      case symbol_kind::S_sync_strength: // sync_strength
        value.YY_MOVE_OR_COPY< enum tchecker::sync_strength_t > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_attr: // attr
        value.YY_MOVE_OR_COPY< std::shared_ptr<tchecker::parsing::attr_t> > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_sync_constraint: // sync_constraint
        value.YY_MOVE_OR_COPY< std::shared_ptr<tchecker::parsing::sync_constraint_t> > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_TOK_ID: // "identifier"
      case symbol_kind::S_TOK_INTEGER: // "integer value"
      case symbol_kind::S_TOK_TEXT: // "text value"
      case symbol_kind::S_text_or_empty: // text_or_empty
        value.YY_MOVE_OR_COPY< std::string > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_sync_constraint_list: // sync_constraint_list
        value.YY_MOVE_OR_COPY< std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_integer: // integer
        value.YY_MOVE_OR_COPY< tchecker::integer_t > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_attr_list: // attr_list
      case symbol_kind::S_non_empty_attr_list: // non_empty_attr_list
        value.YY_MOVE_OR_COPY< tchecker::parsing::attributes_t > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_uinteger: // uinteger
        value.YY_MOVE_OR_COPY< unsigned int > (YY_MOVE (that.value));
        break;

      default:
        break;
    }

#if 201103L <= YY_CPLUSPLUS
    // that is emptied.
    that.state = empty_state;
#endif
  }

  parser_t::stack_symbol_type::stack_symbol_type (state_type s, YY_MOVE_REF (symbol_type) that)
    : super_type (s, YY_MOVE (that.location))
  {
    switch (that.kind ())
    {
      case symbol_kind::S_sync_strength: // sync_strength
        value.move< enum tchecker::sync_strength_t > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_attr: // attr
        value.move< std::shared_ptr<tchecker::parsing::attr_t> > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_sync_constraint: // sync_constraint
        value.move< std::shared_ptr<tchecker::parsing::sync_constraint_t> > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_TOK_ID: // "identifier"
      case symbol_kind::S_TOK_INTEGER: // "integer value"
      case symbol_kind::S_TOK_TEXT: // "text value"
      case symbol_kind::S_text_or_empty: // text_or_empty
        value.move< std::string > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_sync_constraint_list: // sync_constraint_list
        value.move< std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_integer: // integer
        value.move< tchecker::integer_t > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_attr_list: // attr_list
      case symbol_kind::S_non_empty_attr_list: // non_empty_attr_list
        value.move< tchecker::parsing::attributes_t > (YY_MOVE (that.value));
        break;

      case symbol_kind::S_uinteger: // uinteger
        value.move< unsigned int > (YY_MOVE (that.value));
        break;

      default:
        break;
    }

    // that is emptied.
    that.kind_ = symbol_kind::S_YYEMPTY;
  }

#if YY_CPLUSPLUS < 201103L
  parser_t::stack_symbol_type&
  parser_t::stack_symbol_type::operator= (const stack_symbol_type& that)
  {
    state = that.state;
    switch (that.kind ())
    {
      case symbol_kind::S_sync_strength: // sync_strength
        value.copy< enum tchecker::sync_strength_t > (that.value);
        break;

      case symbol_kind::S_attr: // attr
        value.copy< std::shared_ptr<tchecker::parsing::attr_t> > (that.value);
        break;

      case symbol_kind::S_sync_constraint: // sync_constraint
        value.copy< std::shared_ptr<tchecker::parsing::sync_constraint_t> > (that.value);
        break;

      case symbol_kind::S_TOK_ID: // "identifier"
      case symbol_kind::S_TOK_INTEGER: // "integer value"
      case symbol_kind::S_TOK_TEXT: // "text value"
      case symbol_kind::S_text_or_empty: // text_or_empty
        value.copy< std::string > (that.value);
        break;

      case symbol_kind::S_sync_constraint_list: // sync_constraint_list
        value.copy< std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > (that.value);
        break;

      case symbol_kind::S_integer: // integer
        value.copy< tchecker::integer_t > (that.value);
        break;

      case symbol_kind::S_attr_list: // attr_list
      case symbol_kind::S_non_empty_attr_list: // non_empty_attr_list
        value.copy< tchecker::parsing::attributes_t > (that.value);
        break;

      case symbol_kind::S_uinteger: // uinteger
        value.copy< unsigned int > (that.value);
        break;

      default:
        break;
    }

    location = that.location;
    return *this;
  }

  parser_t::stack_symbol_type&
  parser_t::stack_symbol_type::operator= (stack_symbol_type& that)
  {
    state = that.state;
    switch (that.kind ())
    {
      case symbol_kind::S_sync_strength: // sync_strength
        value.move< enum tchecker::sync_strength_t > (that.value);
        break;

      case symbol_kind::S_attr: // attr
        value.move< std::shared_ptr<tchecker::parsing::attr_t> > (that.value);
        break;

      case symbol_kind::S_sync_constraint: // sync_constraint
        value.move< std::shared_ptr<tchecker::parsing::sync_constraint_t> > (that.value);
        break;

      case symbol_kind::S_TOK_ID: // "identifier"
      case symbol_kind::S_TOK_INTEGER: // "integer value"
      case symbol_kind::S_TOK_TEXT: // "text value"
      case symbol_kind::S_text_or_empty: // text_or_empty
        value.move< std::string > (that.value);
        break;

      case symbol_kind::S_sync_constraint_list: // sync_constraint_list
        value.move< std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > (that.value);
        break;

      case symbol_kind::S_integer: // integer
        value.move< tchecker::integer_t > (that.value);
        break;

      case symbol_kind::S_attr_list: // attr_list
      case symbol_kind::S_non_empty_attr_list: // non_empty_attr_list
        value.move< tchecker::parsing::attributes_t > (that.value);
        break;

      case symbol_kind::S_uinteger: // uinteger
        value.move< unsigned int > (that.value);
        break;

      default:
        break;
    }

    location = that.location;
    // that is emptied.
    that.state = empty_state;
    return *this;
  }
#endif

  template <typename Base>
  void
  parser_t::yy_destroy_ (const char* yymsg, basic_symbol<Base>& yysym) const
  {
    if (yymsg)
      YY_SYMBOL_PRINT (yymsg, yysym);
  }

#if SPYYDEBUG
  template <typename Base>
  void
  parser_t::yy_print_ (std::ostream& yyo, const basic_symbol<Base>& yysym) const
  {
    std::ostream& yyoutput = yyo;
    YY_USE (yyoutput);
    if (yysym.empty ())
      yyo << "empty symbol";
    else
      {
        symbol_kind_type yykind = yysym.kind ();
        yyo << (yykind < YYNTOKENS ? "token" : "nterm")
            << ' ' << yysym.name () << " ("
            << yysym.location << ": ";
        switch (yykind)
    {
      case symbol_kind::S_TOK_ID: // "identifier"
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < std::string > (); }
#line 447 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_TOK_INTEGER: // "integer value"
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < std::string > (); }
#line 453 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_TOK_TEXT: // "text value"
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < std::string > (); }
#line 459 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_attr_list: // attr_list
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < tchecker::parsing::attributes_t > (); }
#line 465 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_non_empty_attr_list: // non_empty_attr_list
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < tchecker::parsing::attributes_t > (); }
#line 471 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_attr: // attr
#line 95 "system.yy"
                 { yyoutput << * yysym.value.template as < std::shared_ptr<tchecker::parsing::attr_t> > (); }
#line 477 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_text_or_empty: // text_or_empty
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < std::string > (); }
#line 483 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_sync_constraint_list: // sync_constraint_list
#line 98 "system.yy"
                 {
  for (auto it = yysym.value.template as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ().begin(); it != yysym.value.template as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ().end(); ++it) {
    if (it != yysym.value.template as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ().begin())
      yyoutput << ",";
    yyoutput << *it;
  }
}
#line 495 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_sync_constraint: // sync_constraint
#line 95 "system.yy"
                 { yyoutput << * yysym.value.template as < std::shared_ptr<tchecker::parsing::sync_constraint_t> > (); }
#line 501 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_sync_strength: // sync_strength
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < enum tchecker::sync_strength_t > (); }
#line 507 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_integer: // integer
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < tchecker::integer_t > (); }
#line 513 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      case symbol_kind::S_uinteger: // uinteger
#line 94 "system.yy"
                 { yyoutput << yysym.value.template as < unsigned int > (); }
#line 519 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
        break;

      default:
        break;
    }
        yyo << ')';
      }
  }
#endif

  void
  parser_t::yypush_ (const char* m, YY_MOVE_REF (stack_symbol_type) sym)
  {
    if (m)
      YY_SYMBOL_PRINT (m, sym);
    yystack_.push (YY_MOVE (sym));
  }

  void
  parser_t::yypush_ (const char* m, state_type s, YY_MOVE_REF (symbol_type) sym)
  {
#if 201103L <= YY_CPLUSPLUS
    yypush_ (m, stack_symbol_type (s, std::move (sym)));
#else
    stack_symbol_type ss (s, sym);
    yypush_ (m, ss);
#endif
  }

  void
  parser_t::yypop_ (int n) YY_NOEXCEPT
  {
    yystack_.pop (n);
  }

#if SPYYDEBUG
  std::ostream&
  parser_t::debug_stream () const
  {
    return *yycdebug_;
  }

  void
  parser_t::set_debug_stream (std::ostream& o)
  {
    yycdebug_ = &o;
  }


  parser_t::debug_level_type
  parser_t::debug_level () const
  {
    return yydebug_;
  }

  void
  parser_t::set_debug_level (debug_level_type l)
  {
    yydebug_ = l;
  }
#endif // SPYYDEBUG

  parser_t::state_type
  parser_t::yy_lr_goto_state_ (state_type yystate, int yysym)
  {
    int yyr = yypgoto_[yysym - YYNTOKENS] + yystate;
    if (0 <= yyr && yyr <= yylast_ && yycheck_[yyr] == yystate)
      return yytable_[yyr];
    else
      return yydefgoto_[yysym - YYNTOKENS];
  }

  bool
  parser_t::yy_pact_value_is_default_ (int yyvalue) YY_NOEXCEPT
  {
    return yyvalue == yypact_ninf_;
  }

  bool
  parser_t::yy_table_value_is_error_ (int yyvalue) YY_NOEXCEPT
  {
    return yyvalue == yytable_ninf_;
  }

  int
  parser_t::operator() ()
  {
    return parse ();
  }

  int
  parser_t::parse ()
  {
    int yyn;
    /// Length of the RHS of the rule being reduced.
    int yylen = 0;

    // Error handling.
    int yynerrs_ = 0;
    int yyerrstatus_ = 0;

    /// The lookahead symbol.
    symbol_type yyla;

    /// The locations where the error started and ended.
    stack_symbol_type yyerror_range[3];

    /// The return value of parse ().
    int yyresult;

#if YY_EXCEPTIONS
    try
#endif // YY_EXCEPTIONS
      {
    YYCDEBUG << "Starting parse\n";


    // User initialization code.
#line 55 "system.yy"
{
  // Initialize the initial location.
  yyla.location.begin.filename = yyla.location.end.filename = &const_cast<std::string &>(filename);
  
  old_error_count = tchecker::log_error_count();
}

#line 646 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"


    /* Initialize the stack.  The initial state will be set in
       yynewstate, since the latter expects the semantical and the
       location values to have been already stored, initialize these
       stacks with a primary value.  */
    yystack_.clear ();
    yypush_ (YY_NULLPTR, 0, YY_MOVE (yyla));

  /*-----------------------------------------------.
  | yynewstate -- push a new symbol on the stack.  |
  `-----------------------------------------------*/
  yynewstate:
    YYCDEBUG << "Entering state " << int (yystack_[0].state) << '\n';
    YY_STACK_PRINT ();

    // Accept?
    if (yystack_[0].state == yyfinal_)
      YYACCEPT;

    goto yybackup;


  /*-----------.
  | yybackup.  |
  `-----------*/
  yybackup:
    // Try to take a decision without lookahead.
    yyn = yypact_[+yystack_[0].state];
    if (yy_pact_value_is_default_ (yyn))
      goto yydefault;

    // Read a lookahead token.
    if (yyla.empty ())
      {
        YYCDEBUG << "Reading a token\n";
#if YY_EXCEPTIONS
        try
#endif // YY_EXCEPTIONS
          {
            symbol_type yylookahead (yylex (filename, system_declaration));
            yyla.move (yylookahead);
          }
#if YY_EXCEPTIONS
        catch (const syntax_error& yyexc)
          {
            YYCDEBUG << "Caught exception: " << yyexc.what() << '\n';
            error (yyexc);
            goto yyerrlab1;
          }
#endif // YY_EXCEPTIONS
      }
    YY_SYMBOL_PRINT ("Next token is", yyla);

    if (yyla.kind () == symbol_kind::S_YYerror)
    {
      // The scanner already issued an error message, process directly
      // to error recovery.  But do not keep the error token as
      // lookahead, it is too special and may lead us to an endless
      // loop in error recovery. */
      yyla.kind_ = symbol_kind::S_YYUNDEF;
      goto yyerrlab1;
    }

    /* If the proper action on seeing token YYLA.TYPE is to reduce or
       to detect an error, take that action.  */
    yyn += yyla.kind ();
    if (yyn < 0 || yylast_ < yyn || yycheck_[yyn] != yyla.kind ())
      {
        goto yydefault;
      }

    // Reduce or error.
    yyn = yytable_[yyn];
    if (yyn <= 0)
      {
        if (yy_table_value_is_error_ (yyn))
          goto yyerrlab;
        yyn = -yyn;
        goto yyreduce;
      }

    // Count tokens shifted since error; after three, turn off error status.
    if (yyerrstatus_)
      --yyerrstatus_;

    // Shift the lookahead token.
    yypush_ ("Shifting", state_type (yyn), YY_MOVE (yyla));
    goto yynewstate;


  /*-----------------------------------------------------------.
  | yydefault -- do the default action for the current state.  |
  `-----------------------------------------------------------*/
  yydefault:
    yyn = yydefact_[+yystack_[0].state];
    if (yyn == 0)
      goto yyerrlab;
    goto yyreduce;


  /*-----------------------------.
  | yyreduce -- do a reduction.  |
  `-----------------------------*/
  yyreduce:
    yylen = yyr2_[yyn];
    {
      stack_symbol_type yylhs;
      yylhs.state = yy_lr_goto_state_ (yystack_[yylen].state, yyr1_[yyn]);
      /* Variants are always initialized to an empty instance of the
         correct type. The default '$$ = $1' action is NOT applied
         when using variants.  */
      switch (yyr1_[yyn])
    {
      case symbol_kind::S_sync_strength: // sync_strength
        yylhs.value.emplace< enum tchecker::sync_strength_t > ();
        break;

      case symbol_kind::S_attr: // attr
        yylhs.value.emplace< std::shared_ptr<tchecker::parsing::attr_t> > ();
        break;

      case symbol_kind::S_sync_constraint: // sync_constraint
        yylhs.value.emplace< std::shared_ptr<tchecker::parsing::sync_constraint_t> > ();
        break;

      case symbol_kind::S_TOK_ID: // "identifier"
      case symbol_kind::S_TOK_INTEGER: // "integer value"
      case symbol_kind::S_TOK_TEXT: // "text value"
      case symbol_kind::S_text_or_empty: // text_or_empty
        yylhs.value.emplace< std::string > ();
        break;

      case symbol_kind::S_sync_constraint_list: // sync_constraint_list
        yylhs.value.emplace< std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ();
        break;

      case symbol_kind::S_integer: // integer
        yylhs.value.emplace< tchecker::integer_t > ();
        break;

      case symbol_kind::S_attr_list: // attr_list
      case symbol_kind::S_non_empty_attr_list: // non_empty_attr_list
        yylhs.value.emplace< tchecker::parsing::attributes_t > ();
        break;

      case symbol_kind::S_uinteger: // uinteger
        yylhs.value.emplace< unsigned int > ();
        break;

      default:
        break;
    }


      // Default location.
      {
        stack_type::slice range (yystack_, yylen);
        YYLLOC_DEFAULT (yylhs.location, range, yylen);
        yyerror_range[1].location = yylhs.location;
      }

      // Perform the reduction.
      YY_REDUCE_PRINT (yyn);
#if YY_EXCEPTIONS
      try
#endif // YY_EXCEPTIONS
        {
          switch (yyn)
            {
  case 2: // $@1: %empty
#line 111 "system.yy"
                                                             {
  std::stringstream loc;
  loc << yylhs.location;
  system_declaration = std::make_shared<tchecker::parsing::system_declaration_t>(yystack_[2].value.as < std::string > (), yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
}
#line 824 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 3: // system: eol_sequence "system" ":" "identifier" attr_list end_declaration $@1 declaration_list
#line 117 "system.yy"
{
  if (tchecker::log_error_count() > old_error_count)
    system_declaration = nullptr;
}
#line 833 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 4: // system: error "end of file"
#line 122 "system.yy"
{
  system_declaration = nullptr;
}
#line 841 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 5: // declaration_list: non_empty_declaration_list eol_sequence
#line 130 "system.yy"
{}
#line 847 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 6: // declaration_list: eol_sequence
#line 132 "system.yy"
{}
#line 853 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 7: // non_empty_declaration_list: eol_sequence declaration
#line 138 "system.yy"
{}
#line 859 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 8: // non_empty_declaration_list: non_empty_declaration_list eol_sequence declaration
#line 140 "system.yy"
{}
#line 865 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 9: // declaration: "clock" ":" uinteger ":" "identifier" attr_list end_declaration
#line 146 "system.yy"
{
  auto exist_d = system_declaration->get_clock_declaration(yystack_[2].value.as < std::string > ());
  if (exist_d != nullptr)
    std::cerr << tchecker::log_error << yystack_[2].location << " multiple declarations of clock " << yystack_[2].value.as < std::string > () << std::endl;
  else {
    auto intd = system_declaration->get_int_declaration(yystack_[2].value.as < std::string > ());
    if (intd != nullptr)
      std::cerr << tchecker::log_error << yystack_[2].location << " variable " << yystack_[2].value.as < std::string > () << " already declared as an int" << std::endl;
    else {
      try {
        std::stringstream loc;
        loc << yylhs.location;
        auto d = std::make_shared<tchecker::parsing::clock_declaration_t>(yystack_[2].value.as < std::string > (), yystack_[4].value.as < unsigned int > (), yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
        if ( ! system_declaration->insert_clock_declaration(d) )
          std::cerr << tchecker::log_error << yylhs.location << " insertion of clock declaration failed" << std::endl;
      }
      catch (std::exception const & e) {
        std::cerr << tchecker::log_error << yylhs.location << " " << e.what() << std::endl;
      }
    }
  }
}
#line 892 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 10: // declaration: "edge" ":" "identifier" ":" "identifier" ":" "identifier" ":" "identifier" attr_list end_declaration
#line 170 "system.yy"
{
  auto proc = system_declaration->get_process_declaration(yystack_[8].value.as < std::string > ());
  if (proc == nullptr)
    std::cerr << tchecker::log_error << yystack_[8].location << " process " << yystack_[8].value.as < std::string > () << " is not declared" << std::endl;
  else {
    auto src = system_declaration->get_location_declaration(yystack_[8].value.as < std::string > (), yystack_[6].value.as < std::string > ());
    if (src == nullptr)
      std::cerr << tchecker::log_error << yystack_[6].location << " location " << yystack_[6].value.as < std::string > () << " is not declared in process " << yystack_[8].value.as < std::string > () << std::endl;
    else {
      auto tgt = system_declaration->get_location_declaration(yystack_[8].value.as < std::string > (), yystack_[4].value.as < std::string > ());
      if (tgt == nullptr)
        std::cerr << tchecker::log_error << yystack_[4].location << " location " << yystack_[4].value.as < std::string > () << " is not declared in process " << yystack_[8].value.as < std::string > () << std::endl;
      else {
        auto event = system_declaration->get_event_declaration(yystack_[2].value.as < std::string > ());
        if (event == nullptr)
          std::cerr << tchecker::log_error << yystack_[2].location << " event " << yystack_[2].value.as < std::string > () << " is not declared" << std::endl;
        else {
          try {
            std::stringstream loc;
            loc << yylhs.location;
            auto d = std::make_shared<tchecker::parsing::edge_declaration_t>(proc, src, tgt, event, yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
            if ( ! system_declaration->insert_edge_declaration(d) ) {
              std::cerr << tchecker::log_error << yylhs.location << " insertion of edge declaration failed" << std::endl;
              d = nullptr;
            }
          }
          catch (std::exception const & e) {
            std::cerr << tchecker::log_error << yylhs.location << " " << e.what() << std::endl;
          }
        }
      }
    }
  }
}
#line 931 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 11: // declaration: "event" ":" "identifier" attr_list end_declaration
#line 206 "system.yy"
{
  auto exist_d = system_declaration->get_event_declaration(yystack_[2].value.as < std::string > ());
  if (exist_d != nullptr)
    std::cerr << tchecker::log_error << yystack_[2].location << " multiple declarations of event " << yystack_[2].value.as < std::string > () << std::endl;
  else {
    try {
      std::stringstream loc;
      loc << yylhs.location;
      auto d = std::make_shared<tchecker::parsing::event_declaration_t>(yystack_[2].value.as < std::string > (), yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
      if ( ! system_declaration->insert_event_declaration(d) ) {
        std::cerr << tchecker::log_error << yylhs.location << " insertion of event declaration failed" << std::endl;
        d = nullptr;
      }
    }
    catch (std::exception const & e) {
      std::cerr << yylhs.location << " " << e.what() << std::endl;
    }
  }
}
#line 955 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 12: // declaration: "int" ":" uinteger ":" integer ":" integer ":" integer ":" "identifier" attr_list end_declaration
#line 227 "system.yy"
{
  auto exist_d = system_declaration->get_int_declaration(yystack_[2].value.as < std::string > ());
  if (exist_d != nullptr)
    std::cerr << tchecker::log_error << yystack_[2].location << " multiple declarations of int variable " << yystack_[2].value.as < std::string > () << std::endl;
  else {
    auto clockd = system_declaration->get_clock_declaration(yystack_[2].value.as < std::string > ());
    if (clockd != nullptr)
      std::cerr << tchecker::log_error << yystack_[2].location << " variable " << yystack_[2].value.as < std::string > () << " already declared as a clock" << std::endl;
    else {
      try {
        std::stringstream loc;
        loc << yylhs.location;
        auto d = std::make_shared<tchecker::parsing::int_declaration_t>(yystack_[2].value.as < std::string > (), yystack_[10].value.as < unsigned int > (), yystack_[8].value.as < tchecker::integer_t > (), yystack_[6].value.as < tchecker::integer_t > (), yystack_[4].value.as < tchecker::integer_t > (), yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
        if ( ! system_declaration->insert_int_declaration(d) ) {
          std::cerr << tchecker::log_error << yylhs.location << " insertion of int declaration failed" << std::endl;
          d = nullptr;
        }
      }
      catch (std::exception const & e) {
        std::cerr << tchecker::log_error << yylhs.location << " " << e.what() << std::endl;
      }
    }
  }
}
#line 984 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 13: // declaration: "location" ":" "identifier" ":" "identifier" attr_list end_declaration
#line 253 "system.yy"
{
  auto exist_d = system_declaration->get_location_declaration(yystack_[4].value.as < std::string > (), yystack_[2].value.as < std::string > ());
  if (exist_d != nullptr)
    std::cerr << tchecker::log_error << yystack_[2].location << " multiple declarations of location " << yystack_[2].value.as < std::string > () << " in process " << yystack_[4].value.as < std::string > () << std::endl;
  else {
    auto proc = system_declaration->get_process_declaration(yystack_[4].value.as < std::string > ());
    if (proc == nullptr)
      std::cerr << tchecker::log_error << yystack_[4].location << " process " << yystack_[4].value.as < std::string > () << " is not declared" << std::endl;
    else {
      try {
        std::stringstream loc;
        loc << yylhs.location;
        auto d = std::make_shared<location_declaration_t>(yystack_[2].value.as < std::string > (), proc, yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
        if ( ! system_declaration->insert_location_declaration(d) ) {
          std::cerr << tchecker::log_error << yylhs.location << " insertion of location declaration failed" << std::endl;
          d = nullptr;
        }
      }
      catch (std::exception const & e) {
        std::cerr << tchecker::log_error << yylhs.location << " " << e.what() << std::endl;
      }
    }
  }
}
#line 1013 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 14: // declaration: "process" ":" "identifier" attr_list end_declaration
#line 279 "system.yy"
{
  auto exist_d = system_declaration->get_process_declaration(yystack_[2].value.as < std::string > ());
  if (exist_d != nullptr)
    std::cerr << tchecker::log_error << yystack_[2].location << " multiple declarations of process " << yystack_[2].value.as < std::string > () << std::endl;
  else {
    try {
      std::stringstream loc;
      loc << yylhs.location;
      auto d = std::make_shared<tchecker::parsing::process_declaration_t>(yystack_[2].value.as < std::string > (), yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
      if ( ! system_declaration->insert_process_declaration(d) ) {
        std::cerr << tchecker::log_error << yystack_[0].location << " insertion of process declaration failed" << std::endl;
        d = nullptr;
      }
    }
    catch (std::exception const & e) {
      std::cerr << tchecker::log_error << yystack_[0].location << " " << e.what() << std::endl;
    }
  }
}
#line 1037 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 15: // declaration: "sync" ":" sync_constraint_list attr_list end_declaration
#line 300 "system.yy"
{
  try {
    std::stringstream loc;
    loc << yylhs.location;
    auto d = std::make_shared<tchecker::parsing::sync_declaration_t>(yystack_[2].value.as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > (), yystack_[1].value.as < tchecker::parsing::attributes_t > (), loc.str());
    if ( ! system_declaration->insert_sync_declaration(d) ) {
      std::cerr << tchecker::log_error << yylhs.location << " insertion of sync declaration failed" << std::endl;
      d = nullptr;
    }
  }
  catch (std::exception const & e) {
    std::cerr << tchecker::log_error << yylhs.location << " " << e.what() << std::endl;
  }
}
#line 1056 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 17: // attr_list: "{" non_empty_attr_list "}"
#line 321 "system.yy"
{ yylhs.value.as < tchecker::parsing::attributes_t > () = std::move(yystack_[1].value.as < tchecker::parsing::attributes_t > ()); }
#line 1062 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 18: // attr_list: "{" "}"
#line 323 "system.yy"
{ yylhs.value.as < tchecker::parsing::attributes_t > ().clear(); }
#line 1068 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 19: // attr_list: %empty
#line 325 "system.yy"
{ yylhs.value.as < tchecker::parsing::attributes_t > ().clear(); }
#line 1074 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 20: // non_empty_attr_list: attr
#line 331 "system.yy"
{
  yylhs.value.as < tchecker::parsing::attributes_t > ().insert(yystack_[0].value.as < std::shared_ptr<tchecker::parsing::attr_t> > ());
}
#line 1082 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 21: // non_empty_attr_list: non_empty_attr_list ":" attr
#line 335 "system.yy"
{
  yystack_[2].value.as < tchecker::parsing::attributes_t > ().insert(yystack_[0].value.as < std::shared_ptr<tchecker::parsing::attr_t> > ());
  yylhs.value.as < tchecker::parsing::attributes_t > () = std::move(yystack_[2].value.as < tchecker::parsing::attributes_t > ());
}
#line 1091 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 22: // attr: "identifier" ":" text_or_empty
#line 344 "system.yy"
{
  if (yystack_[2].value.as < std::string > () == "")
    throw std::runtime_error("empty tokens should not be accepted by the parser");
  std::stringstream key_loc, value_loc;
  key_loc << yystack_[2].location;
  value_loc << yystack_[0].location;
  boost::trim(yystack_[0].value.as < std::string > ());
  yylhs.value.as < std::shared_ptr<tchecker::parsing::attr_t> > () = std::make_shared<tchecker::parsing::attr_t>(yystack_[2].value.as < std::string > (), yystack_[0].value.as < std::string > (), tchecker::parsing::attr_parsing_position_t{key_loc.str(), value_loc.str()});
}
#line 1105 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 23: // text_or_empty: "text value"
#line 358 "system.yy"
{ yylhs.value.as < std::string > () = std::move(yystack_[0].value.as < std::string > ()); }
#line 1111 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 24: // text_or_empty: %empty
#line 360 "system.yy"
{ yylhs.value.as < std::string > ().clear(); }
#line 1117 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 25: // sync_constraint_list: sync_constraint
#line 366 "system.yy"
{
  if (yystack_[0].value.as < std::shared_ptr<tchecker::parsing::sync_constraint_t> > () != nullptr)
    yylhs.value.as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ().push_back(yystack_[0].value.as < std::shared_ptr<tchecker::parsing::sync_constraint_t> > ());
}
#line 1126 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 26: // sync_constraint_list: sync_constraint_list ":" sync_constraint
#line 371 "system.yy"
{
  if (yystack_[0].value.as < std::shared_ptr<tchecker::parsing::sync_constraint_t> > () != nullptr)
    yystack_[2].value.as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ().push_back(yystack_[0].value.as < std::shared_ptr<tchecker::parsing::sync_constraint_t> > ());
  yylhs.value.as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > () = std::move(yystack_[2].value.as < std::vector<std::shared_ptr<tchecker::parsing::sync_constraint_t>> > ());
}
#line 1136 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 27: // sync_constraint: "identifier" "@" "identifier" sync_strength
#line 381 "system.yy"
{
  auto proc = system_declaration->get_process_declaration(yystack_[3].value.as < std::string > ());
  if (proc == nullptr)
    std::cerr << tchecker::log_error << yystack_[3].location << " process " << yystack_[3].value.as < std::string > () << " is not declared" << std::endl;
  else {
    auto event = system_declaration->get_event_declaration(yystack_[1].value.as < std::string > ());
    if (event == nullptr)
      std::cerr << tchecker::log_error << yystack_[1].location << " event " << yystack_[1].value.as < std::string > () << " is not declared" << std::endl;
    else
      yylhs.value.as < std::shared_ptr<tchecker::parsing::sync_constraint_t> > () = std::make_shared<tchecker::parsing::sync_constraint_t>(proc, event, yystack_[0].value.as < enum tchecker::sync_strength_t > ());
  }
}
#line 1153 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 28: // sync_strength: "?"
#line 398 "system.yy"
{ yylhs.value.as < enum tchecker::sync_strength_t > () = tchecker::SYNC_WEAK; }
#line 1159 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 29: // sync_strength: %empty
#line 400 "system.yy"
{ yylhs.value.as < enum tchecker::sync_strength_t > () = tchecker::SYNC_STRONG; }
#line 1165 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 34: // integer: "integer value"
#line 418 "system.yy"
{
  try {
    long long l = std::stoll(yystack_[0].value.as < std::string > (), nullptr, 10);
    if ( (l < std::numeric_limits<tchecker::integer_t>::min()) || (l > std::numeric_limits<tchecker::integer_t>::max()) )
      throw std::out_of_range("integer constant our of range");
    yylhs.value.as < tchecker::integer_t > () = static_cast<tchecker::integer_t>(l);
  }
  catch (std::exception const & e) {
    std::cerr << tchecker::log_error << yystack_[0].location << " value " << yystack_[0].value.as < std::string > () << " out of range ";
    std::cerr << std::numeric_limits<tchecker::integer_t>::min() << "," << std::numeric_limits<tchecker::integer_t>::max();
    std::cerr << std::endl;
    yylhs.value.as < tchecker::integer_t > () = 0;
  }
}
#line 1184 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;

  case 35: // uinteger: "integer value"
#line 437 "system.yy"
{
  try {
    unsigned long l = std::stoul(yystack_[0].value.as < std::string > (), nullptr, 10);
    if (l > std::numeric_limits<unsigned int>::max())
      throw std::out_of_range("unsigned integer out of range");
    yylhs.value.as < unsigned int > () = static_cast<unsigned int>(l);
  }
  catch (std::exception const & e) {
    std::cerr << tchecker::log_error << yystack_[0].location << " value " << yystack_[0].value.as < std::string > () << " out of range ";
    std::cerr << std::numeric_limits<unsigned int>::min() << "," << std::numeric_limits<unsigned int>::max();
    std::cerr << std::endl;
    yylhs.value.as < unsigned int > () = 0;
  }
}
#line 1203 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"
    break;


#line 1207 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"

            default:
              break;
            }
        }
#if YY_EXCEPTIONS
      catch (const syntax_error& yyexc)
        {
          YYCDEBUG << "Caught exception: " << yyexc.what() << '\n';
          error (yyexc);
          YYERROR;
        }
#endif // YY_EXCEPTIONS
      YY_SYMBOL_PRINT ("-> $$ =", yylhs);
      yypop_ (yylen);
      yylen = 0;

      // Shift the result of the reduction.
      yypush_ (YY_NULLPTR, YY_MOVE (yylhs));
    }
    goto yynewstate;


  /*--------------------------------------.
  | yyerrlab -- here on detecting error.  |
  `--------------------------------------*/
  yyerrlab:
    // If not already recovering from an error, report this error.
    if (!yyerrstatus_)
      {
        ++yynerrs_;
        context yyctx (*this, yyla);
        std::string msg = yysyntax_error_ (yyctx);
        error (yyla.location, YY_MOVE (msg));
      }


    yyerror_range[1].location = yyla.location;
    if (yyerrstatus_ == 3)
      {
        /* If just tried and failed to reuse lookahead token after an
           error, discard it.  */

        // Return failure if at end of input.
        if (yyla.kind () == symbol_kind::S_YYEOF)
          YYABORT;
        else if (!yyla.empty ())
          {
            yy_destroy_ ("Error: discarding", yyla);
            yyla.clear ();
          }
      }

    // Else will try to reuse lookahead token after shifting the error token.
    goto yyerrlab1;


  /*---------------------------------------------------.
  | yyerrorlab -- error raised explicitly by YYERROR.  |
  `---------------------------------------------------*/
  yyerrorlab:
    /* Pacify compilers when the user code never invokes YYERROR and
       the label yyerrorlab therefore never appears in user code.  */
    if (false)
      YYERROR;

    /* Do not reclaim the symbols of the rule whose action triggered
       this YYERROR.  */
    yypop_ (yylen);
    yylen = 0;
    YY_STACK_PRINT ();
    goto yyerrlab1;


  /*-------------------------------------------------------------.
  | yyerrlab1 -- common code for both syntax error and YYERROR.  |
  `-------------------------------------------------------------*/
  yyerrlab1:
    yyerrstatus_ = 3;   // Each real token shifted decrements this.
    // Pop stack until we find a state that shifts the error token.
    for (;;)
      {
        yyn = yypact_[+yystack_[0].state];
        if (!yy_pact_value_is_default_ (yyn))
          {
            yyn += symbol_kind::S_YYerror;
            if (0 <= yyn && yyn <= yylast_
                && yycheck_[yyn] == symbol_kind::S_YYerror)
              {
                yyn = yytable_[yyn];
                if (0 < yyn)
                  break;
              }
          }

        // Pop the current state because it cannot handle the error token.
        if (yystack_.size () == 1)
          YYABORT;

        yyerror_range[1].location = yystack_[0].location;
        yy_destroy_ ("Error: popping", yystack_[0]);
        yypop_ ();
        YY_STACK_PRINT ();
      }
    {
      stack_symbol_type error_token;

      yyerror_range[2].location = yyla.location;
      YYLLOC_DEFAULT (error_token.location, yyerror_range, 2);

      // Shift the error token.
      error_token.state = state_type (yyn);
      yypush_ ("Shifting", YY_MOVE (error_token));
    }
    goto yynewstate;


  /*-------------------------------------.
  | yyacceptlab -- YYACCEPT comes here.  |
  `-------------------------------------*/
  yyacceptlab:
    yyresult = 0;
    goto yyreturn;


  /*-----------------------------------.
  | yyabortlab -- YYABORT comes here.  |
  `-----------------------------------*/
  yyabortlab:
    yyresult = 1;
    goto yyreturn;


  /*-----------------------------------------------------.
  | yyreturn -- parsing is finished, return the result.  |
  `-----------------------------------------------------*/
  yyreturn:
    if (!yyla.empty ())
      yy_destroy_ ("Cleanup: discarding lookahead", yyla);

    /* Do not reclaim the symbols of the rule whose action triggered
       this YYABORT or YYACCEPT.  */
    yypop_ (yylen);
    YY_STACK_PRINT ();
    while (1 < yystack_.size ())
      {
        yy_destroy_ ("Cleanup: popping", yystack_[0]);
        yypop_ ();
      }

    return yyresult;
  }
#if YY_EXCEPTIONS
    catch (...)
      {
        YYCDEBUG << "Exception caught: cleaning lookahead and stack\n";
        // Do not try to display the values of the reclaimed symbols,
        // as their printers might throw an exception.
        if (!yyla.empty ())
          yy_destroy_ (YY_NULLPTR, yyla);

        while (1 < yystack_.size ())
          {
            yy_destroy_ (YY_NULLPTR, yystack_[0]);
            yypop_ ();
          }
        throw;
      }
#endif // YY_EXCEPTIONS
  }

  void
  parser_t::error (const syntax_error& yyexc)
  {
    error (yyexc.location, yyexc.what ());
  }

  /* Return YYSTR after stripping away unnecessary quotes and
     backslashes, so that it's suitable for yyerror.  The heuristic is
     that double-quoting is unnecessary unless the string contains an
     apostrophe, a comma, or backslash (other than backslash-backslash).
     YYSTR is taken from yytname.  */
  std::string
  parser_t::yytnamerr_ (const char *yystr)
  {
    if (*yystr == '"')
      {
        std::string yyr;
        char const *yyp = yystr;

        for (;;)
          switch (*++yyp)
            {
            case '\'':
            case ',':
              goto do_not_strip_quotes;

            case '\\':
              if (*++yyp != '\\')
                goto do_not_strip_quotes;
              else
                goto append;

            append:
            default:
              yyr += *yyp;
              break;

            case '"':
              return yyr;
            }
      do_not_strip_quotes: ;
      }

    return yystr;
  }

  std::string
  parser_t::symbol_name (symbol_kind_type yysymbol)
  {
    return yytnamerr_ (yytname_[yysymbol]);
  }



  // parser_t::context.
  parser_t::context::context (const parser_t& yyparser, const symbol_type& yyla)
    : yyparser_ (yyparser)
    , yyla_ (yyla)
  {}

  int
  parser_t::context::expected_tokens (symbol_kind_type yyarg[], int yyargn) const
  {
    // Actual number of expected tokens
    int yycount = 0;

    const int yyn = yypact_[+yyparser_.yystack_[0].state];
    if (!yy_pact_value_is_default_ (yyn))
      {
        /* Start YYX at -YYN if negative to avoid negative indexes in
           YYCHECK.  In other words, skip the first -YYN actions for
           this state because they are default actions.  */
        const int yyxbegin = yyn < 0 ? -yyn : 0;
        // Stay within bounds of both yycheck and yytname.
        const int yychecklim = yylast_ - yyn + 1;
        const int yyxend = yychecklim < YYNTOKENS ? yychecklim : YYNTOKENS;
        for (int yyx = yyxbegin; yyx < yyxend; ++yyx)
          if (yycheck_[yyx + yyn] == yyx && yyx != symbol_kind::S_YYerror
              && !yy_table_value_is_error_ (yytable_[yyx + yyn]))
            {
              if (!yyarg)
                ++yycount;
              else if (yycount == yyargn)
                return 0;
              else
                yyarg[yycount++] = YY_CAST (symbol_kind_type, yyx);
            }
      }

    if (yyarg && yycount == 0 && 0 < yyargn)
      yyarg[0] = symbol_kind::S_YYEMPTY;
    return yycount;
  }






  int
  parser_t::yy_syntax_error_arguments_ (const context& yyctx,
                                                 symbol_kind_type yyarg[], int yyargn) const
  {
    /* There are many possibilities here to consider:
       - If this state is a consistent state with a default action, then
         the only way this function was invoked is if the default action
         is an error action.  In that case, don't check for expected
         tokens because there are none.
       - The only way there can be no lookahead present (in yyla) is
         if this state is a consistent state with a default action.
         Thus, detecting the absence of a lookahead is sufficient to
         determine that there is no unexpected or expected token to
         report.  In that case, just report a simple "syntax error".
       - Don't assume there isn't a lookahead just because this state is
         a consistent state with a default action.  There might have
         been a previous inconsistent state, consistent state with a
         non-default action, or user semantic action that manipulated
         yyla.  (However, yyla is currently not documented for users.)
       - Of course, the expected token list depends on states to have
         correct lookahead information, and it depends on the parser not
         to perform extra reductions after fetching a lookahead from the
         scanner and before detecting a syntax error.  Thus, state merging
         (from LALR or IELR) and default reductions corrupt the expected
         token list.  However, the list is correct for canonical LR with
         one exception: it will still contain any token that will not be
         accepted due to an error action in a later state.
    */

    if (!yyctx.lookahead ().empty ())
      {
        if (yyarg)
          yyarg[0] = yyctx.token ();
        int yyn = yyctx.expected_tokens (yyarg ? yyarg + 1 : yyarg, yyargn - 1);
        return yyn + 1;
      }
    return 0;
  }

  // Generate an error message.
  std::string
  parser_t::yysyntax_error_ (const context& yyctx) const
  {
    // Its maximum.
    enum { YYARGS_MAX = 5 };
    // Arguments of yyformat.
    symbol_kind_type yyarg[YYARGS_MAX];
    int yycount = yy_syntax_error_arguments_ (yyctx, yyarg, YYARGS_MAX);

    char const* yyformat = YY_NULLPTR;
    switch (yycount)
      {
#define YYCASE_(N, S)                         \
        case N:                               \
          yyformat = S;                       \
        break
      default: // Avoid compiler warnings.
        YYCASE_ (0, YY_("syntax error"));
        YYCASE_ (1, YY_("syntax error, unexpected %s"));
        YYCASE_ (2, YY_("syntax error, unexpected %s, expecting %s"));
        YYCASE_ (3, YY_("syntax error, unexpected %s, expecting %s or %s"));
        YYCASE_ (4, YY_("syntax error, unexpected %s, expecting %s or %s or %s"));
        YYCASE_ (5, YY_("syntax error, unexpected %s, expecting %s or %s or %s or %s"));
#undef YYCASE_
      }

    std::string yyres;
    // Argument number.
    std::ptrdiff_t yyi = 0;
    for (char const* yyp = yyformat; *yyp; ++yyp)
      if (yyp[0] == '%' && yyp[1] == 's' && yyi < yycount)
        {
          yyres += symbol_name (yyarg[yyi++]);
          ++yyp;
        }
      else
        yyres += *yyp;
    return yyres;
  }


  const signed char parser_t::yypact_ninf_ = -75;

  const signed char parser_t::yytable_ninf_ = -34;

  const signed char
  parser_t::yypact_[] =
  {
       6,     9,    34,    19,   -75,   -75,   -75,    36,    26,    39,
      20,     2,   -75,    37,    27,   -75,   -75,   -75,   -75,    29,
      44,   -75,   -75,   -75,   -75,   -75,   -75,   -75,    10,    42,
       2,    45,    50,    56,    58,    59,    60,    62,   -75,   -75,
     -75,    53,    57,    61,    53,    63,    64,    65,   -75,    66,
      67,    39,    68,    70,    39,    73,    11,   -75,    69,    71,
       2,    54,    72,     2,    74,    65,     2,    39,    75,   -75,
     -75,    76,    39,   -75,    79,   -75,   -75,     2,    77,    54,
       2,   -75,   -75,   -75,    78,    83,   -75,    80,    54,    39,
      84,     2,    81,   -75,    39,     2,   -75
  };

  const signed char
  parser_t::yydefact_[] =
  {
       0,     0,     0,     0,     4,     1,    32,     0,     0,    19,
       0,     0,    18,     0,     0,    20,    31,    30,     2,    24,
       0,    17,    33,    23,    22,    21,     3,    33,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     7,     8,
      16,     0,     0,     0,     0,     0,     0,     0,    35,     0,
       0,    19,     0,     0,    19,     0,    19,    25,     0,     0,
       0,     0,     0,     0,     0,     0,     0,    19,     0,    11,
      34,     0,    19,    14,    29,    26,    15,     0,     0,     0,
       0,    28,    27,     9,     0,     0,    13,     0,     0,    19,
       0,     0,     0,    10,    19,     0,    12
  };

  const signed char
  parser_t::yypgoto_[] =
  {
     -75,   -75,   -75,   -75,   -75,    82,   -50,   -75,    85,   -75,
     -75,    25,   -75,   -30,   -19,   -74,    47
  };

  const signed char
  parser_t::yydefgoto_[] =
  {
       0,     2,    22,    26,    27,    38,    11,    14,    15,    24,
      56,    57,    82,    18,     3,    71,    49
  };

  const signed char
  parser_t::yytable_[] =
  {
      40,    60,    16,    28,    63,    85,    66,     1,    29,     4,
      -6,    30,    17,    31,    90,    65,   -33,    77,    10,    32,
       6,    33,    80,    34,   -33,    35,    36,    37,    12,     6,
      69,    20,    13,    73,     5,    21,    76,     7,     9,    91,
       8,    19,    -5,    30,    95,    31,    10,    83,    23,    41,
      86,    32,     6,    33,    42,    34,    13,    35,    36,    37,
      43,    93,    44,    45,    46,    96,    47,    48,    70,    50,
      58,    59,    61,    51,    62,    53,    54,    55,    64,    78,
      79,    67,    87,    68,    72,    81,    74,    88,    92,    84,
      75,    52,    89,    94,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,    25,     0,     0,     0,     0,
       0,    39
  };

  const signed char
  parser_t::yycheck_[] =
  {
      30,    51,     0,    22,    54,    79,    56,     1,    27,     0,
       0,     1,    10,     3,    88,     4,    10,    67,     7,     9,
      10,    11,    72,    13,    18,    15,    16,    17,     8,    10,
      60,     4,    12,    63,     0,     8,    66,    18,    12,    89,
       4,     4,     0,     1,    94,     3,     7,    77,    19,     4,
      80,     9,    10,    11,     4,    13,    12,    15,    16,    17,
       4,    91,     4,     4,     4,    95,     4,    14,    14,    12,
       4,     4,     4,    12,     4,    12,    12,    12,     5,     4,
       4,    12,     4,    12,    12,     6,    12,     4,     4,    12,
      65,    44,    12,    12,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    20,    -1,    -1,    -1,    -1,
      -1,    29
  };

  const signed char
  parser_t::yystos_[] =
  {
       0,     1,    21,    34,     0,     0,    10,    18,     4,    12,
       7,    26,     8,    12,    27,    28,     0,    10,    33,     4,
       4,     8,    22,    19,    29,    28,    23,    24,    34,    34,
       1,     3,     9,    11,    13,    15,    16,    17,    25,    25,
      33,     4,     4,     4,     4,     4,     4,     4,    14,    36,
      12,    12,    36,    12,    12,    12,    30,    31,     4,     4,
      26,     4,     4,    26,     5,     4,    26,    12,    12,    33,
      14,    35,    12,    33,    12,    31,    33,    26,     4,     4,
      26,     6,    32,    33,    12,    35,    33,     4,     4,    12,
      35,    26,     4,    33,    12,    26,    33
  };

  const signed char
  parser_t::yyr1_[] =
  {
       0,    20,    22,    21,    21,    23,    23,    24,    24,    25,
      25,    25,    25,    25,    25,    25,    25,    26,    26,    26,
      27,    27,    28,    29,    29,    30,    30,    31,    32,    32,
      33,    33,    34,    34,    35,    36
  };

  const signed char
  parser_t::yyr2_[] =
  {
       0,     2,     0,     8,     2,     2,     1,     2,     3,     7,
      11,     5,    13,     7,     5,     5,     2,     3,     2,     0,
       1,     3,     3,     1,     0,     1,     3,     4,     1,     0,
       1,     1,     2,     0,     1,     1
  };


#if SPYYDEBUG || 1
  // YYTNAME[SYMBOL-NUM] -- String name of the symbol SYMBOL-NUM.
  // First, the terminals, then, starting at \a YYNTOKENS, nonterminals.
  const char*
  const parser_t::yytname_[] =
  {
  "\"end of file\"", "error", "\"invalid token\"", "\"clock\"", "\":\"",
  "\"@\"", "\"?\"", "\"{\"", "\"}\"", "\"edge\"", "\"\\n\"", "\"event\"",
  "\"identifier\"", "\"int\"", "\"integer value\"", "\"location\"",
  "\"process\"", "\"sync\"", "\"system\"", "\"text value\"", "$accept",
  "system", "$@1", "declaration_list", "non_empty_declaration_list",
  "declaration", "attr_list", "non_empty_attr_list", "attr",
  "text_or_empty", "sync_constraint_list", "sync_constraint",
  "sync_strength", "end_declaration", "eol_sequence", "integer",
  "uinteger", YY_NULLPTR
  };
#endif


#if SPYYDEBUG
  const short
  parser_t::yyrline_[] =
  {
       0,   111,   111,   111,   121,   129,   131,   137,   139,   145,
     169,   205,   226,   252,   278,   299,   315,   320,   322,   325,
     330,   334,   343,   357,   360,   365,   370,   380,   397,   400,
     405,   406,   411,   412,   417,   436
  };

  void
  parser_t::yy_stack_print_ () const
  {
    *yycdebug_ << "Stack now";
    for (stack_type::const_iterator
           i = yystack_.begin (),
           i_end = yystack_.end ();
         i != i_end; ++i)
      *yycdebug_ << ' ' << int (i->state);
    *yycdebug_ << '\n';
  }

  void
  parser_t::yy_reduce_print_ (int yyrule) const
  {
    int yylno = yyrline_[yyrule];
    int yynrhs = yyr2_[yyrule];
    // Print the symbols being reduced, and their result.
    *yycdebug_ << "Reducing stack by rule " << yyrule - 1
               << " (line " << yylno << "):\n";
    // The symbols being reduced.
    for (int yyi = 0; yyi < yynrhs; yyi++)
      YY_SYMBOL_PRINT ("   $" << yyi + 1 << " =",
                       yystack_[(yynrhs) - (yyi + 1)]);
  }
#endif // SPYYDEBUG


#line 13 "system.yy"
} } } // tchecker::parsing::system
#line 1734 "/Users/zhaochen/Downloads/build/src/parsing/system_parser/system.tab.cc"

#line 454 "system.yy"


void tchecker::parsing::system::parser_t::error(location_type const & l, std::string const & msg)
{
  std::cerr << tchecker::log_error << l << " " << msg << std::endl;
}
